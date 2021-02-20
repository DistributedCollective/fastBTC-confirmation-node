/**
 * 
 */
import Web3 from 'web3';
import multisigAbi from '../config/multisigabi';
import contractAbi from "../config/contractAbi";
import conf from '../config/config';
import wallets from '../secrets/accounts';
import { Mutex } from 'async-mutex';
import walletManager from './walletCtrl';


class MainController {
    constructor() {
        this.web3 = new Web3(conf.nodeProvider);
        this.multisig = new this.web3.eth.Contract(abiComplete, conf.sovrynProtocolAdr);
        this.mutex = new Mutex();
        walletManager.init(this.web3);
    }

    start() {
        setInterval(this.getNewWithdrawRequest, 1000 * 60);
    }

    getWithdrawRequest() {
        //1. parse all events
        //2. for every event: call isConfirmed on the multisig to check wheter this proposal is still valid
        //3. if so: confirmWithdrawRequest
    }


    /*
    /// @dev Allows an owner to confirm a transaction.
    /// @param transactionId Transaction ID.
    function confirmTransaction(uint256 transactionId)
        public
        ownerExists(msg.sender)
        transactionExists(transactionId)
        notConfirmed(transactionId, msg.sender)
    {
        confirmations[transactionId][msg.sender] = true;
        emit Confirmation(msg.sender, transactionId);
        executeTransaction(transactionId);
    }

    */
    confirmWithdrawRequest(txId) {
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