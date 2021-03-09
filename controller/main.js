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
  * todo: check if txID was already processed in DB
    // otherwise:
    //store txHash+btc address + txID in db
  */
    async pollAndConfirmWithdrawRequests() {
        let from = conf.startIndex;

        while (true) {     
            const numberOfTransactions = await this.getNrOfTx();
            console.log("Number of pending transactions", numberOfTransactions);

            for(let txID = from; txID < numberOfTransactions;txID++){
                const isProcessed = await this.checkIfProcessed(txID);

                if (!isProcessed) {
                    const {btcAdr, txHash } = await this.getPayment(txID);

                    if(!btcAdr  || !txHash) {
                        from = txID+1;
                        continue;
                    }

                    console.log("Got payment info"); 
                    console.log("BTC address is", btcAdr); console.log("Transaction hash is", txHash);

                    const verified = await this.verifyPaymentInfo(btcAdr, txHash)

                    if (verified) {
                        await rskCtrl.confirmWithdrawRequest(txID);
                        console.log(isConfirmed + "\n 'from' is now " + txID)
                    }
                } 
                from = txID+1
                console.log("'from' is now " + txID)
                await U.wasteTime(1); //do not torture the node
            }
            await U.wasteTime(5);
        }
    }


    async getNrOfTx(){
        while(true) {
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
                continue;
            }
        }
    }

    async checkIfProcessed(txId){
        try{
            const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txId).call();
            const txObj = await rskCtrl.multisig.methods["transactions"](txId).call();
            console.log(i+": is confirmed: "+isConfirmed+", is executed: "+txObj.executed);

            return isConfirmed || txObj.executed;
        }
        catch(e){
            console.error("Error getting confirmed info");
            console.error(e);
            return true; //need to be true to not be processed again
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
            console.error("error on getting deposit BTC address for "+txId);
            //console.error(err);
            return {btcAdr:null, txHash:null};
        }
    }

    /**
     * Checks wheter
     * 1. the provided btc address was derived from the same public keys and the same derivation scheme or not
     * btcAdr and txHash can't be null!
     * 2. the tx hash is valid
     * 3. timestamp < 1h (pull)
     * 4. todo: btc deposit address match
     */
    async verifyPaymentInfo(btcAdr, txHash) {
        if (generatedBtcAddresses.indexOf(btcAdr)==-1) {
            console.error("Wrong btc address");
            return false;
        } 
    
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
}

export default new MainController();