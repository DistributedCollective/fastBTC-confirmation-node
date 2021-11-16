/**
 * Main controller.
 * Connects to the master node to receive credentials for the Btc node.
 * Starts polling for new withdraw requests on the Rsk multisig and confirms them if they were not confirmed already and the provided
 * tx hash from the master node can be verified.
 *
 * Known security issue: The master node can create withdrawals to a different Rsk address than provided by the user.
 * This problem can be solved by adding a public database where users Btc addresses are connected to Rsk addresses with a signature.
 */

import conf from '../config/config';
import BitcoinNodeWrapper from "../utils/bitcoinNodeWrapper";
import generatedBtcAddresses from "../db/genBtcAddresses.json";
import rskCtrl from './rskCtrl';
import dbCtrl from "./dbCtrl";
import U from '../utils/helper';
import loggingUtil from '../utils/loggingUtil';
import {createMasterNodeComm} from './masterNodeComm';
import AddressMappingSigner from '../utils/addressMappingSignature';


class MainController {
    async init() {
        await rskCtrl.init();
        await dbCtrl.initDb(conf.db);

        this.masterNodeComm = await createMasterNodeComm(
            conf.masterNode,
            conf.account.pKey ||
            rskCtrl.web3.eth.accounts.decrypt(
                conf.account.ks, process.argv[3]
            ).privateKey
        );

        this.walletAddress = conf.account.adr.toLowerCase();
        this.addressMappingSigner = new AddressMappingSigner();

        try {
            const resp = await this.masterNodeComm.post("getCosignerIndexAndDelay");
            console.log(resp.data);

            console.log("My index as cosigner is " + resp.data.index);
            console.log("My delay is " + resp.data.delay + " seconds");
            this.delay = resp.data.delay;

            const node = await this.masterNodeComm.post("getNode");

            if (!node || !node.data || !node.data.url) {
                console.error("Can't continue without access to a btc node");
                return;
            }

            conf.btcNodeProvider = node.data;
            this.api = BitcoinNodeWrapper;
            this.api.init(conf.btcNodeProvider);
            console.log("Node setup successfully")
        } catch (err) {
            // Handle Error Here
            console.error("error on authentication");
            console.error(err);
            process.exit(1);
        }
    }

    async mainLoop() {
        await Promise.all([
            this.pollAndConfirmWithdrawRequests(),
            this.pollAndSignDepositAddresses()
        ])
    }

    /**
     * Creates an infinite loop
     * 1. Get all txIds from the Rsk multisig
     * 2. For every txId: check if is was already confirmed
     * if not: Get corresponding btc deposit txHash and address from the master,
     * verify this information and process the confirmation
     */
    async pollAndConfirmWithdrawRequests() {
        let from = conf.startIndex;

        // check if we have processed until a later transaction
        const lastTx = await dbCtrl.lastProcessedTxID.findOne({id: 0})
        if (lastTx.txId > from) {
            from = lastTx.txId + 1;
        }

        while (true) {
            const numberOfTransactions = await this.getNrOfTx();
            const earliestConfirmationTime = Date.now() + this.delay * 1000;

            loggingUtil.logUnique(
                "multisig_tx_count",
                `Number of transactions ${numberOfTransactions}`
            );

            let storedTxHash = null;

            for (let txID = from; txID < numberOfTransactions; txID++) {
                const isProcessed = await this.checkIfProcessed(txID);

                if (!isProcessed) {
                    await U.untilAfter(earliestConfirmationTime);

                    const {
                        btcAdr,
                        txHash,
                        vout,
                        web3Adr,
                        signatures
                    } = await this.getPayment(txID);
                    storedTxHash = txHash;

                    if (!btcAdr || !txHash) {
                        from = txID + 1;
                        continue;
                    }

                    console.log("Got payment info");
                    console.log("BTC address is %s", btcAdr);
                    console.log("Transaction hash is %s; vout %s", txHash, vout);

                    const verified = await this.verifyPaymentInfo({
                        btcAdr,
                        txHash,
                        vout,
                        web3Adr,
                        signatures,
                        txID,
                    });
                    console.log("LastProcessedTxId verified: %s", verified);

                    if (verified) {
                        // just do it once more to decrease number of races
                        (async () => {
                            for (let tries = 1; tries <= 3; tries++) {
                                try {
                                    if (await this.checkIfProcessed(txID)) {
                                        console.log("LastProcessedTxId already processed!");
                                        return;
                                    }
                                    await rskCtrl.confirmWithdrawRequest(txID);
                                    return;
                                } catch (err) {
                                    if (tries === 3) {
                                        throw new Error(`Giving up on txID ${txID} - ${tries} failed tries`);
                                    }

                                    console.error(
                                        "Confirming txID %s failed, tries %d: %s",
                                        txID, tries, err.toString()
                                    );
                                }
                            }
                        })().catch(function (err) {
                            console.error(
                                "Confirmation failed after 3 tries: "
                                + err.toString()
                            );
                        })
                    }
                }

                await dbCtrl.lastProcessedTxID.update(
                    {
                        id: 0,
                    },
                    {
                        txID: txID,
                        txHash: storedTxHash,
                        dateAdded: Date.now(),
                    }
                )

                from = txID + 1;
                console.log("next transaction shall be %d", txID);
            }
            await U.wasteTime(1);
        }
    }

    async getNrOfTx() {
        while (true) {
            try {
                const numberOfTransactions = await rskCtrl.multisig.methods["getTransactionCount"](true, true).call();
                if (!numberOfTransactions) {
                    await U.wasteTime(5)
                    continue;
                }
                return numberOfTransactions;
            } catch (e) {
                console.error("Error getting transaction count");
                console.error(e);
                await U.wasteTime(5)
            }
        }
    }

    async checkIfProcessed(txId) {
        let cnt = 0;
        while (true) {
            try {
                const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txId).call();
                const txObj = await rskCtrl.multisig.methods["transactions"](txId).call();
                console.log(txId + ": is confirmed: " + isConfirmed + ", is executed: " + txObj.executed);

                return isConfirmed || txObj.executed;
            } catch (e) {
                console.error("Error getting confirmed info");
                console.error(e);
                await U.wasteTime(5);
                cnt++;

                if (cnt === 5) {
                    return true;
                } //need to be true so the same tx is not processed again

                // continue
            }
        }
    }


    /**
     * Get transaction info from the Btc node
     */
    async getPayment(txId) {
        for (let retry = 0; retry < 4; retry++) {
            try {
                const resp = await this.masterNodeComm.post(
                    "getPayment",
                    {txId: txId}
                );

                const data = resp.data;
                if (data && data.txHash && data.btcAdr) {
                    console.log("the BTC address is " + data.btcAdr);
                    console.log("the transaction hash is " + data.txHash);
                    console.log("the vout is " + data.vout);
                    return data;
                }
                console.log("did not get payment info from master for %d, try %d", txId, retry);
            } catch (err) {
                console.error(err.toString());
            }

            await U.wasteTime(2 ** retry);
        }

        console.error("failed to get payment info from master for txId %d", txId);
        return {txHash: null, btcAdr: null, vout: null};
    }

    /**
     * Checks whether
     * 1. the provided btc address was derived from the same public keys and the same derivation scheme or not
     * btcAdr and txHash can't be null!
     * 2. the tx hash is valid
     * 3. timestamp < 1h (work in progress)
     * 4. todo: btc deposit address match
     */
    async verifyPaymentInfo({btcAdr, txHash, vout, web3Adr, signatures, txID}) {
        if (generatedBtcAddresses.indexOf(btcAdr) === -1) {
            console.error("Wrong btc address");
            return false;
        }

        const tx = await this.api.getRawTx(txHash);

        if (!tx || !tx.vout) {
            console.log("Not a valid BTC transaction hash or missing payment info")
            return false;
        }

        if (vout === -1 || vout == null) {
            // find the payment in xact
            const addrInVout = (tx.vout || []).find(out => out.address === btcAdr);
            if (!addrInVout) {
                console.log("BTC address is not in vout of tx");
                return false;
            }
        } else {
            let found = false;

            // we've got a specific vout number now!
            for (let voutItem of tx.vout) {
                if (voutItem.vout === vout && voutItem.address === btcAdr) {
                    found = true;
                    break;
                }
            }

            if (!found) {
                console.log("The given BTC address is not in vout %d of tx, or no such vout exists", vout);
                return false;
            }
        }

        const cosigners = new Set((await rskCtrl.getCurrentCoSigners()).map((a) => a.toLowerCase()));
        let required = await rskCtrl.getRequiredNumberOfCoSigners();

        if (!required || required < 0) {
            console.error("Can't really have zero required signatures");
            return false;
        }

        console.log('%d signatures required for deposit addresses', required);
        for (const signature of signatures) {
            const signer = await this.addressMappingSigner.getSigningAddress(
                btcAdr, web3Adr, signature.signature
            );

            // returns true if found + pop too
            if (cosigners.delete(signer.toLowerCase())) {
                required--;
            }
        }

        if (required) {
            console.error('No sufficient deposit address signatures, ' +
                'or invalid signatures');
            return false;
        }

        const addedPayment = await dbCtrl.getPayment(txHash, vout);
        if (addedPayment) {
            console.error(`double spend attempted for ${txHash}/${vout}`);
            return false;
        }

        await dbCtrl.addPaymentTx(txHash, vout, Number(tx.value) / 1e8, new Date(tx.blockTime), txID);
        console.log('Valid BTC deposit');
        return true;
    }

    async getAddressMappingSignatures(dbMapping) {
        return await dbCtrl.depositAddressSignature.find({
            deposit_address_id: dbMapping.id
        });
    }

    // async addAddressMappingSignatures(dbMapping, signatures) {
    //     for (const signature of signatures) {
    //         if (await dbCtrl.depositAddressSignature.find({
    //             deposit_address_id: dbMapping.id,
    //             signer: signatures.signer
    //         })) {
    //             console.log(`Signature for address mapping ${dbMapping} for signer ${signatures.signer} were already saved`)
    //             continue;
    //         }
    //
    //         if (await this.verifySignature(dbMapping, signature)) {
    //             console.log(`Stored new signature for `)
    //             await dbCtrl.depositAddressSignature.insert({
    //                 deposit_address_id: dbMapping.id,
    //                 signer: signature.signer,
    //                 signature: signature.signature,
    //             });
    //         }
    //     }
    // }

    async signAddressMapping(btcAddress, web3Address) {
        return this.addressMappingSigner.signAddressMapping(
            btcAddress,
            web3Address,
        )
    }

    async addAddressMapping(mapping) {
        if (generatedBtcAddresses.indexOf(mapping.btcAddress) === -1) {
            console.error(`Invalid btcAddress injection attempted: ${mapping.btcAddress} not in list`);
            return;
        }

        let dbMapping = await dbCtrl.getDepositAddressInfo(
            mapping.btcAddress
        );

        if (!dbMapping) {
            await dbCtrl.insertDepositAddressMapping(
                mapping.btcAddress,
                mapping.web3Address
            );

            dbMapping = await dbCtrl.getDepositAddressInfo(
                mapping.btcAddress
            );
        }

        if (mapping.web3Address !== dbMapping.rsk_address) {
            console.error(`Master attempted to remap existing deposit address ${mapping.btcAddress} to ${mapping.web3Address}, was mapped to ${dbMapping.rsk_address}`);
            return;
        }

        try {
            const signature = await this.signAddressMapping(
                dbMapping.btc_deposit_address,
                dbMapping.rsk_address,
            );

            await dbCtrl.insertOrUpdateAddressMappingSignature(
                dbMapping,
                this.walletAddress,
                signature,
            );

            await this.masterNodeComm.post('addAddressMappingSignature',
                {
                    btcAddress: mapping.btcAddress,
                    web3Address: mapping.web3Address,
                    signature
                }
            );
        }
        catch (e) {
            console.error(`Failed to update deposit address mapping:`, e);
        }
    }

    async pollAndSignDepositAddresses() {
        while (true) {
            await U.wasteTime(1);

            let resp;
            try {
                resp = await this.masterNodeComm.post(
                    'getUnsignedDepositAddresses',
                    10
                );
            } catch (e) {
                console.error('Failed to get new deposit addresses', e);
                continue;
            }

            const {addresses} = resp.data;

            if (!addresses || !addresses.length) {
                continue;
            }

            console.log("Got %d new deposit address mappings", addresses.length);
            for (const address of addresses) {
                await this.addAddressMapping(address);
            }
        }
    }
}

export default new MainController();
