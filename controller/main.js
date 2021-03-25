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
            this.delay=resp.data.delay;

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
     * Creates an inifinite loop
     * 1. Get all txIds from the Rsk multisig
     * 2. For every txId: check if is was already confirmed
     * if not: Get corresponding btc deposit txHash and address from the master, verify this information and process the confirmation
     */
    async pollAndConfirmWithdrawRequests() {
        let from = conf.startIndex;
        
        while (true) {     
            const numberOfTransactions = await this.getNrOfTx();
            console.log("Number of pending transactions", numberOfTransactions);
            
            await U.wasteTime(this.delay);

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
                    console.log(verified);
                    if (verified) {
                        rskCtrl.confirmWithdrawRequest(txID);
                        console.log("from is now " + txID)
                    }
                } 
                from = txID+1
                console.log("'from' is now " + txID)
                await U.wasteTime(1); //do not torture the node
            }
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
        let cnt=0;
        while(true){
            try{
                const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txId).call();
                const txObj = await rskCtrl.multisig.methods["transactions"](txId).call();
                console.log(txId+": is confirmed: "+isConfirmed+", is executed: "+txObj.executed);

                return isConfirmed || txObj.executed;
            }
            catch(e){
                console.error("Error getting confirmed info");
                console.error(e);
                await U.wasteTime(5) 
                cnt++;

                if(cnt==5) return true; //need to be true so the same tx is not processed again
                continue;
            }
        }
    }


    /**
     * Get transaction info from the Btc node
     */
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
     * 3. timestamp < 1h (work in progress)
     * 4. todo: btc deposit address match
     */
    async verifyPaymentInfo(btcAdr, txHash) {
        if (generatedBtcAddresses.indexOf(btcAdr)==-1) {
            console.error("Wrong btc address");
            return false;
        } 
    
        const tx = await this.api.getRawTx(txHash);
        
        if (!tx || !tx.vout) {
            console.log("Not a valid BTC transaction hash or missing payment info")
            return false;
        }
        
        const addrInVout = (tx.vout || []).find(out => out.address === btcAdr);

        if (!addrInVout) {
            console.log("BTC address is not in vout of tx");
            return false;
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