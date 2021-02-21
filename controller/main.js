/**
 * 
 */
import Web3 from 'web3';
import multisigAbi from '../config/multisigAbi';
import conf from '../config/config';
import U from '../utils/helper';
import { Mutex } from 'async-mutex';
import walletManager from './walletCtrl';
import U from '../utils/helper';

class MainController {
    constructor() {
        this.web3 = new Web3(conf.nodeProvider);
        this.multisig = new this.web3.eth.Contract(multisigAbi, conf.multisigAddress);
        this.mutex = new Mutex();
        walletManager.init(this.web3);
    }

    start() {
        this.pollGetAllEvents()
    }

    async pollGetAllEvents() {
        await this.getAllEvents()
        setInterval(async () => {
            await this.getAllEvents()
        }, 10000) // run every 10 seconds 
    }

    async getAllEvents() {
        const receipts = [];
        const numberOfTransactions = await this.multisig.methods["getTransactionCount"](true, false).call();
        const allTransactionsIds = await this.multisig.methods["getTransactionIds"](0, numberOfTransactions, true, false).call();
        allTransactionsIds.forEach(async txId => {
            const isConfirmed = await this.multisig.methods["isConfirmed"](txId).call();
            if (!isConfirmed) {
                const receipt = await this.confirmWithdrawRequest(txId);
                receipts.push(receipt)
            }
        })
        return receipts
    }

    async getWithdrawRequest(txId) {
        const tx = await this.multisig.methods["transactions"](txId).call();
        console.log(tx);
        this.confirmWithdrawRequest(0);
    }


    async confirmWithdrawRequest(txId) {
        console.log("confirm tx "+txId);
        const wallet = await this.getWallet();
        if (wallet.length == 0) return { error: "no wallet available to process the assignment" };
        const nonce = await this.web3.eth.getTransactionCount(wallet, 'pending');
        const gasPrice = await this.getGasPrice();

        const receipt = await this.multisig.methods.confirmTransaction(txId).send({
            from: wallet,
            gas: 1000000,
            gasPrice: gasPrice,
            nonce: nonce
        });

        walletManager.decreasePending(wallet);
        return receipt;
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


export default new MainController();