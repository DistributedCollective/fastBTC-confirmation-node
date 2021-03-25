/**
 * Confirms rBtc withdrawals on a multisig contract 
 */
import Web3 from 'web3';
import telegramBot from '../utils/telegram';
import multisigAbi from '../config/multisigAbi';
import conf from '../config/config';
import { Mutex } from 'async-mutex';
import walletManager from './walletCtrl';
import U from '../utils/helper';

class RskCtrl {
    init() {
        this.web3 = new Web3(conf.rskNodeProvider);
        this.mutex = new Mutex();
        this.multisig = new this.web3.eth.Contract(multisigAbi, conf.multisigAddress);
        walletManager.init(this.web3);
        this.lastGasPrice=0;
        this.lastNonce=0;
    }

    async confirmWithdrawRequest(txId) {
        console.log("confirm tx " + txId);
        
        const wallet = await this.getWallet();
        if (wallet.length == 0) return { error: "no wallet available to process the assignment" };
       
        try {
            this.lastNonce = await this.getNonce(wallet);
            this.lastGasPrice = await this.getGasPrice();
            console.log("Send tx with nonce: "+this.lastNonce);
    
            const receipt = await this.multisig.methods.confirmTransaction(txId).send({
                from: wallet,
                gas: 1000000,
                gasPrice: this.lastGasPrice,
                nonce: this.lastNonce
            });
            
            console.log("tx receipt:");
            console.log(receipt);
            if (telegramBot) telegramBot.sendMessage(`Transaction with ID ${txId} confirmed. Check it in: ${conf.blockExplorer}/tx/${receipt.transactionHash}`);
            
            walletManager.decreasePending(wallet);
        } catch (err) {
            console.error("Error confirming tx "+txId);
            console.error(err);
            walletManager.decreasePending(wallet);
            if (telegramBot) telegramBot.sendMessage("Error confirming transaction with ID " + txId);
        }
    }




    /**
     * @notice loads a free wallet from the wallet manager 
     * @dev this is secured by a mutex to make sure we're never exceeding 4 pending transactions per wallet
     */
    async getWallet() {
        await this.mutex.acquire();
        let wallet = "";
        let timeout = 5 * 60 * 1000;
        try {
            //if I have to wait, any other thread needs to wait as well
            wallet = await walletManager.getFreeWallet(timeout);
            //because the node can't handle too many simultaneous requests
            await U.wasteTime(0.5);
            this.mutex.release();
        }
        catch (e) {
            this.mutex.release();
            console.error(e);
        }
        return wallet;
    }


    /**
     * The Rsk node does not return a valid response occassionally for a short period of time
     * Thats why the request is repeated 5 times and in case it still failes the last known gas price is returned
     */
    async getGasPrice() {
        let cnt=0;

        while(true){
            try {
                const gasPrice = await this.web3.eth.getGasPrice();
                return Math.round(gasPrice*1.2); //add security buffer to avoid gasPrice too low error
            }
            catch(e){
                console.error("Error retrieving gas price");
                console.error(e);
                cnt++;
                if(cnt==5) return this.lastGasPrice;
            }
        }
    }

    /**
     * The Rsk node does not return a valid response occassionally for a short period of time
     * Thats why the request is repeated 5 times and in case it still failes the last nonce +1 is returned
     */
    async getNonce(wallet){
        let cnt=0;

        while(true){
            try {
                return await this.web3.eth.getTransactionCount(wallet, 'pending');
            }
            catch(e){
                console.error("Error retrieving gas price");
                console.error(e);
                cnt++;
                if(cnt==5) return this.lastNonce+1;
            }
        }
    }
}

export default new RskCtrl();
