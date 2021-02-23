/**
 * Transfers rBtc from the given wallet to user addresses 
 */
import Web3 from 'web3';
import telegramBot from '../utils/telegram';
import multisigAbi from '../config/multisigAbi';
import conf from '../config/config';
import { Mutex } from 'async-mutex';
import walletManager from './walletCtrl';
import U from '../utils/helper';
import delay from '../start';

class RskCtrl {
    init() {
        this.web3 = new Web3(conf.rskNodeProvider);
        this.mutex = new Mutex();
        this.multisig = new this.web3.eth.Contract(multisigAbi, conf.multisigAddress);
        walletManager.init(this.web3);
    }

    async getBalanceSats(adr) {
        const balWei = await this.web3.eth.getBalance(adr);
        const balBtc = this.web3.utils.fromWei(balWei, 'ether');
        return Number(balBtc) * 1e8;
    }


    async confirmWithdrawRequest(txId) {
        console.log("confirm tx " + txId);
        const wallet = await this.getWallet();
        if (wallet.length == 0) return { error: "no wallet available to process the assignment" };
        const nonce = await this.web3.eth.getTransactionCount(wallet, 'pending');
        const gasPrice = await this.getGasPrice();

        try {
            if (delay > 0) setTimeout(() => console.log("Waiting for my turn as a consigner", delay * 1000));
            const receipt = await this.multisig.methods.confirmTransaction(txId).send({
                from: wallet,
                gas: 1000000,
                gasPrice: gasPrice,
                nonce: nonce
            });
            if (telegramBot) telegramBot.sendMessage(`Transaction with ID ${txId} confirmed. Check it in: ${conf.blockExplorer}/tx/${receipt.transactionHash}`);

            walletManager.decreasePending(wallet);
            return receipt;
        } catch (err) {
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

    async getGasPrice() {
        const gasPrice = await this.web3.eth.getGasPrice();
        return Math.round(gasPrice);
    }
}

export default new RskCtrl();
