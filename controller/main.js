/**
 * 
 */
import Web3 from 'web3';
import multisigAbi from '../config/multisigabi';
import contractAbi from "../config/contractAbi";
import conf from '../config/config';
import wallets from '../secrets/accounts';



class MainController {
    constructor() {
        this.web3 = new Web3(conf.nodeProvider);
        this.contractSovryn = new this.web3.eth.Contract(abiComplete, conf.sovrynProtocolAdr);
    }

    start(){
        setInterval(this.getNewWithdrawRequest, 1000*60);
    }

    getWithdrawRequest(){

    }

    confirmWithdrawRequest(){

    }

}


export default new MainController();