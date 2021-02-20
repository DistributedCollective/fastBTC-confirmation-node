/**
 * 
 */
import Web3 from 'web3';
import multisigAbi from '../config/multisigAbi';
import conf from '../config/config';
import { Mutex } from 'async-mutex';
import walletManager from './walletCtrl';


class MainController {
    constructor() {
        this.web3 = new Web3(conf.nodeProvider);
        this.multisig = new this.web3.eth.Contract(multisigAbi, conf.multisigAddress);
        this.mutex = new Mutex();
        walletManager.init(this.web3);
    }

    start() {
        //setInterval(this.getNewWithdrawRequest, 1000 * 60);
        this.getWithdrawRequest("0xc0ba8fe4b176c1714197d43b9cc6bcf797a4a7461c5fe8d0ef6e184ae7601e51");
    }

    /*
    * Create inifinite loop
        //0. parse all events from start-block (defined in config)
        //1. get tx-id#s
        //2. for tx-id: call isConfirmed on the multisig to check wheter this proposal is still unconfirmed
        //3. if so: confirmWithdrawRequest
    */
    async getWithdrawRequest(txId) {
        const tx = await this.multisig.methods["transactions"](txId).call();
        console.log(tx);
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


}


export default new MainController();