import axios from 'axios';
import conf from '../config/config';
import rskCtrl from './rskCtrl';

class MasterNodeComm {
    constructor(masterNodeUrl, pKey) {
        this.masterNodeUrl = masterNodeUrl;
        this.pKey = pKey;
    }

    async init() { }

    async createPostSignature(){
        const m = "Hi master, " + new Date();
        const signed = await rskCtrl.web3.eth.accounts.sign(m, this.pKey);
        return {
            signedMessage: signed.signature,
            message: m,
            walletAddress: conf.account.adr,
            created: +new Date()
        };
    }

    async post(method, params = {}) {
        const sign = await this.createPostSignature(params);
        return await axios.post(
            this.masterNodeUrl + method,
            {...sign, ...params}
        );
    }
}

export async function createMasterNodeComm(...args) {
    const comm = new MasterNodeComm(...args);
    await comm.init();
    return comm;
}
