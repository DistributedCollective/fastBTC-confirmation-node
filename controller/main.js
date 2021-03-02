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

    async start(){
        this.pollAndConfirmWithdrawRequests();
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


            for (const txID of allTransactionsIDs) {
                const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txID).call();
                if (!isConfirmed) {
                    const {btcAdr, txHash } = await this.getPayment(txID);

                    if(!btcAdr  || !txHash) continue;

                    console.log("Got payment info"); 
                    console.log("BTC address is", btcAdr); console.log("Transaction hash is", txHash);

                    const verification = await this.verifyPaymentInfo(btcAdr, txHash)

                    /*
                    //todo: check if txID was already processed in DB
                    // otherwise:
                    //store txHash+btc address + txID in db
                    */


                    if (verification) {
                        await rskCtrl.confirmWithdrawRequest(txID);
                        console.log(isConfirmed + "\n 'from' is now " + txID)
                        from = txID
                    }

                } else {
                    from = txID
                    console.log("'from' is now " + txID)
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

            if(!resp.data || !resp.data.txHash || !resp.data.btcAdr){
                console.error("Did not get payment info from master");
                return {btcAdr:null, txHash:null};
            }
            console.log(resp.data);

            console.log("The BTC address is " + resp.data.btcAdr);
            console.log("The transaction hash is " + resp.data.txHash);
            return resp.data;
        } catch (err) {
            // Handle Error Here
            console.error("error on getting deposit BTC address");
            console.error(err);
            return {btcAdr:null, txHash:null};
        }
    }

    /**
     * Checks wheter the provided btc address was derived from the same public keys and the same derivation scheme or not
     * tx..
     */
    async verifyPaymentInfo(btcAdr, txHash) {
        if (!btcAdr || generatedBtcAddresses.indexOf(btcAdr)==-1) {
            console.error("Wrong btc address");
            return false;
        } 
        if (!txHash) return false;

    
        const tx = await this.api.getRawTx(txHash);
        console.log(tx)
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
}

export default new MainController();