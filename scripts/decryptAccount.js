/**
 * Utility functions to prepare wallets
 */

import Web3 from 'web3';
import conf from '../config/config';
import acc from '../secrets/accounts.js';

var web3 = new Web3(conf.nodeProvider);


const pass = process.argv[3];

function decryptAccount() {
    let r = web3.eth.accounts.decrypt(acc.main.ks, pass);
    console.log(r);
}

decryptAccount();