/**
 * Main ctrl
 * todo1: check master/slave communication error-handling
 * todo2: check if tx happend and was not processed already (db)
 * todo3: store tx-id in db
 */

import conf from '../config/config';
import { networks } from "bitcoinjs-lib";
import BitcoinNodeWrapper from "../utils/bitcoinNodeWrapper";
import generatedBtcAddresses from "../db/genBtcAddresses.json";
import rskCtrl from './rskCtrl';
import U from '../utils/helper';
const axios = require('axios');


class MainController {
    constructor() {
        this.network = conf.network === 'prod' ? networks.bitcoin : networks.testnet;
    }

    async init() {
        await rskCtrl.init();
        const sign = await this.createSignature();
        // a consigner is the slave node watching for withdraw requests that need confirmation
        try {
            const resp = await axios.post(conf.masterNode + "getCosignerIndexAndDelay", sign);
            console.log(resp.data);

            console.log("My index as cosigner is " + resp.data.index);
            console.log("My delay is " + resp.data.delay + " seconds");
            rskCtrl.delay=resp.data.delay;

            const node = await axios.post(conf.masterNode + "getNode", sign);
    
            if(!node || !node.data || !node.data.url){
                console.error("Can't continue without access to a btc node");
                return;
            }
            conf.btcNodeProvider = node.data;
            this.api = BitcoinNodeWrapper;
            this.api.init(conf.btcNodeProvider);
            console.log("Node setup. Start polling for new withdraw requests.")
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
    async pollAndConfirmWithdrawRequests() {
        let from = 0;
        while (true) {
            console.log("Get withdraw requests");
            const numberOfTransactions = await rskCtrl.multisig.methods["getTransactionCount"](true, true).call();
            console.log("Number of pending transactions", numberOfTransactions);

            const allTransactionsIDs = await rskCtrl.multisig.methods["getTransactionIds"](from, numberOfTransactions, true, true).call();
            console.log("There are a total of " + allTransactionsIDs.length + " withdraw requests transactions")


            for (const txId of allTransactionsIDs) {
                if(txId<conf.startIndex) continue;

                const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txId).call();
                if (!isConfirmed) {
                    const { user, tx } = await this.getPayment(txId);

                    if(!user || !tx) {
                        from = txId
                        continue;
                    }

                    console.log("Got payment info"); 
                    console.log("BTC address is", user.btcAdr); console.log("Transaction hash is", tx.txHash);

                    const verification = await this.verifyPaymentInfo(user.btcAdr, tx.txHash)

                    /*
                    //todo: check if txId was already processed in DB
                    // otherwise:
                    //store txHash+btc address + txId in db
                    */

                    if (verification) {
                        await rskCtrl.confirmWithdrawRequest(txId);
                        await this.storeWithdrawRequest(user, tx, txId);
                        from = txId
                        console.log(isConfirmed + "\n 'from' is now " + txId)
                    }

                } else {
                    from = txId
                    console.log("'from' is now " + txId)
                }
                await U.wasteTime(1); //do not torture the node
            }
            await U.wasteTime(5);
        }
    }


    async getPayment(txId) {
        const sign = await this.createSignature();
        try {
            const resp = await axios.post(conf.masterNode + "getPayment", {...sign, txId:txId});

            if(!resp.data || !resp.data.tx || !resp.data.user){
                console.error("Did not get payment info from master");
                return {btcAdr:null, txHash:null};
            }
            console.log(resp.data);

            console.log("The BTC address is " + resp.data.user.btcAdr);
            console.log("The transaction hash is " + resp.data.tx.txHash);
            return resp.data;
        } catch (err) {
            // Handle Error Here
            console.error("error on getting deposit BTC address");
            //console.error(err);
            return {btcAdr:null, txHash:null};
        }
    }

    /**
     * Checks wheter
     * 1. the provided btc address was derived from the same public keys and the same derivation scheme or not
     * 2. the tx hash is valid
     * 3. timestamp < 1h (pull)
     * 4. todo: btc deposit address match
     */
    async verifyPaymentInfo(btcAdr, txHash) {
        if (!btcAdr || generatedBtcAddresses.indexOf(btcAdr)==-1) {
            console.error("Wrong btc address");
            return false;
        } 
        if (!txHash) return false;

    
        const tx = await this.api.getRawTx(txHash);
        //console.log(tx)

        if (!tx) {
            console.log("Not a valid BTC transaction hash or missing payment info")
            return false;
        }
        
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

    /**
     * @param { {label} } user 
     * @param { {txHash, valueBtc} } tx 
     * @param {*} txId 
     * @param { {message, signedMessage, walletAddress}} sign 
     * @returns Boolean
     */
    async storeWithdrawRequest(user, tx, txId, sign) {
        try {
            await axios.post(conf.masterNode + "storeWithdrawRequest", { user, tx, txId, ...sign });
            console.log("Withdraw request succesfully stored in the master node")
            return true;
        } catch (e) {
            console.log(e)
            return null;
        }

    }
}

export default new MainController();