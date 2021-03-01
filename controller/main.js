/**
 * Main ctrl
 * todo1: check master/slave communication error-handling
 * todo2: check if tx happend and was not processed already (db)
 * todo3: store tx-id in db
 */
import { bip32, networks, payments } from "bitcoinjs-lib";
import BitcoinNodeWrapper from "../utils/bitcoinNodeWrapper";
import generatedBtcAddresses from "../genBtcAddresses.json";
import rskCtrl from './rskCtrl';
import conf from '../config/config';
import U from '../utils/helper';
const axios = require('axios');


class MainController {
    constructor() {
        this.api = new BitcoinNodeWrapper(conf.btcNodeProvider);
        this.network = conf.network === 'prod' ? networks.bitcoin : networks.testnet;
    }

    async start() {
        await rskCtrl.init();
       
        const m = "Hi master, "+new Date(Date.now());
        const pKey = conf.account.pKey || rskCtrl.web3.eth.accounts.decrypt(conf.account.ks, process.argv[3]).privateKey;
        this.signed = await rskCtrl.web3.eth.accounts.sign(m, pKey);     
        const p = {
            signedMessage: this.signed.signature,
            message: m,
            walletAddress: conf.account.adr
        };
        
        // a consigner is the slave node watching for withdraw requests that need confirmation
        try {
            const resp = await axios.post(conf.masterNode + "getCosignerIndexAndDelay", p);
            console.log(resp.data);

            console.log("My index as cosigner is " + resp.data.index);
            console.log("My delay is " + resp.data.delay + " seconds");
            this.pollAndConfirmWithdrawRequests(resp.data.delay);

        } catch (err) {
            // Handle Error Here
            console.error("error on authentication");
            console.error(err);
        }

    }


    /**
  * Create inifinite loop
  * 1. get tx-id#s
  * 2. for tx-id: call isConfirmed on the multisig to check wheter this proposal is still unconfirmed
  * 3. if so: confirmWithdrawRequest
  */
    async pollAndConfirmWithdrawRequests(delay) {
        let from = 0;
        while (true) {
            console.log("Get withdraw requests");
            const numberOfTransactions = await rskCtrl.multisig.methods["getTransactionCount"](true, true).call();
            console.log("Number of pending transactions", numberOfTransactions);

            const allTransactionsIDs = await rskCtrl.multisig.methods["getTransactionIds"](from, numberOfTransactions, true, true).call();
            console.log("There are a total of " + allTransactionsIDs.length + " withdraw requests transactions")


            for (const txID of allTransactionsIDs) {
                const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txID).call();
                if (!isConfirmed) {
                    let txHash

                    const btcAdr = await this.getBtcAdr(txID);
                    if (!this.verifyPaymentAdr(btcAdr)) {
                        console.error("Wrong btc address");
                    }

                    if (btcAdr) txHash = this.verifyPaymentAdr(btcAdr);
                    if (!txHash) {
                        console.error("Error or missing payment");
                        continue;
                    }

                    //todo: check if txID was already processed in DB
                    // otherwise:
                    //store txHash+btc address + txID in db

                    await U.wasteTime(delay);
                    await rskCtrl.confirmWithdrawRequest(txID);
                    console.log(isConfirmed + "\n 'from' is now " + txID)
                    from = txID
                }
            }
            await U.wasteTime(5);
        }
    }

    async getBtcAdr(txId) {
        const p = {
            signedMessage: this.signed.signature,
            message: this.signed.message,
            walletAddress: conf.account.adr,
            txId
        };
        try {
            const resp = await axios.post(conf.masterNode + "getBtcAdr", p);
            console.log(resp.data);

            console.log("The BTC address is " + resp.data);
            return resp.data
        } catch (err) {
            // Handle Error Here
            console.error("error on getting deposit BTC address");
            console.error(err);
        }
    }

    async verifyDeposit() {
        const txList = await this.api.listReceivedTxsByLabel(adrLabel, 9999);

        // console.log("Address label %s has %s tx", adrLabel, (txList||[]).length);

        for (const tx of (txList || [])) {
            const confirmations = tx && tx.confirmations;

            if (confirmations === 0) {
                await this.addPendingDepositTx({
                    address: tx.address,
                    value: tx.value,
                    txId: tx.txId,
                    label: adrLabel
                });
            } else if (confirmations >= this.thresholdConfirmations) {
                await this.depositTxConfirmed({
                    address: tx.address,
                    value: tx.value,
                    txId: tx.txId,
                    confirmations: confirmations,
                    label: adrLabel
                });
            }
        }
    }


    /**
     * 
     * 
     */
    verifyPaymentAdr(btcAdr) {
        if (generatedBtcAddresses && generatedBtcAddresses.length > 0) {
            generatedBtcAddresses.find((address) => {
                if(address==btcAdr) return true;
            })
        }
        return false;
    }
}

export default new MainController();