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
const axios = require('axios');


class MainController {
    async init() {
        await rskCtrl.init();
        await dbCtrl.initDb(conf.db);

        const sign = await this.createSignature();
        
        try {
            const resp = await axios.post(conf.masterNode + "getCosignerIndexAndDelay", sign);
            console.log(resp.data);

            console.log("My index as cosigner is " + resp.data.index);
            console.log("My delay is " + resp.data.delay + " seconds");
            this.delay = resp.data.delay;

            const node = await axios.post(conf.masterNode + "getNode", sign);
    
            if(!node || !node.data || !node.data.url){
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
        }
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

            for (let txID = from; txID < numberOfTransactions; txID++){
                const isProcessed = await this.checkIfProcessed(txID);

                if (! isProcessed) {
                    await U.untilAfter(earliestConfirmationTime);

                    const {btcAdr, txHash, vout} = await this.getPayment(txID);
                    storedTxHash = txHash;

                    if(!btcAdr || !txHash) {
                        from = txID + 1;
                        continue;
                    }

                    console.log("Got payment info");
                    console.log("BTC address is %s", btcAdr);
                    console.log("Transaction hash is %s; vout %s", txHash, vout);

                    const verified = await this.verifyPaymentInfo(btcAdr, txHash, vout);
                    console.log("LastProcessedTxId verified: %s", verified);

                    if (verified) {
                        // just do it once more to decrease number of races
                        if (await this.checkIfProcessed(txID)) {
                            console.log("LastProcessedTxId already processed!");
                            continue;
                        }

                        (async () => {
                            for (let tries = 1; tries <= 3; tries++) {
                                try {
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

    async getNrOfTx(){
        while (true) {
            try{
                const numberOfTransactions = await rskCtrl.multisig.methods["getTransactionCount"](true, true).call();
                if(!numberOfTransactions) {
                    await U.wasteTime(5) 
                    continue;
                }
                return numberOfTransactions;
            }
            catch(e){
                console.error("Error getting transaction count");
                console.error(e);
                await U.wasteTime(5) 
                // continue
            }
        }
    }

    async checkIfProcessed(txId){
        let cnt = 0;
        while (true) {
            try{
                const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txId).call();
                const txObj = await rskCtrl.multisig.methods["transactions"](txId).call();
                console.log(txId+": is confirmed: "+isConfirmed+", is executed: "+txObj.executed);

                return isConfirmed || txObj.executed;
            }
            catch(e){
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
        const sign = await this.createSignature();
        for (let retry = 0; retry < 4; retry ++) {
            try {
                const resp = await axios.post(conf.masterNode + "getPayment", {
                    ...sign,
                    txId: txId
                });

                const data = resp.data;
                if (data && data.txHash && data.btcAdr) {
                    console.log("The BTC address is " + data.btcAdr);
                    console.log("The transaction hash is " + data.txHash);
                    console.log("The vout is " + data.vout);
                    return data;
                }
            }
            catch (err) {
                console.error("Did not get payment info from master for %d", txId);
            }

            await U.wasteTime(2 ** retry);
        }

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
    async verifyPaymentInfo(btcAdr, txHash, vout = -1) {
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
        }
        else {
            let found = false;

            // we've got a specific vout number now!
            for (let voutItem of tx.vout) {
                if (voutItem.vout === vout && voutItem.address === btcAdr) {
                    found = true;
                    break;
                }
            }

            if (! found) {
                console.log("The given BTC address is not in vout %d of tx, or no such vout exists", vout);
                return false;
            }
        }

        /*
        const addedPayment = await dbCtrl.getPayment(txHash);

        if (!addedPayment) {
            console.log("deposit payment already existed")
            return false;
        }

        await dbCtrl.addPaymentTx(txHash, Number(tx.value)/1e8, new Date(tx.blockTime));
        */

        console.log("Valid BTC transaction hash")
        return true;  
    }

    async createSignature(){
        const m = "Hi master, "+new Date(Date.now());
        const pKey = conf.account.pKey || rskCtrl.web3.eth.accounts.decrypt(conf.account.ks, process.argv[3]).privateKey;
        const signed = await rskCtrl.web3.eth.accounts.sign(m, pKey);     
        return {
            signedMessage: signed.signature,
            message: m,
            walletAddress: conf.account.adr
        };
    }
}

export default new MainController();
