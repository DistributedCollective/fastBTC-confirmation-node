/**
 * Utility functions to prepare wallets
 */

import Web3 from 'web3';
import conf from '../config/config';
var fs = require('fs');
var web3 = new Web3(conf.nodeProvider);

const pass = process.argv[3];

function createAccount() {
    var account = web3.eth.accounts.create();
    const ks = web3.eth.accounts.encrypt(account.privateKey, pass);

    const w = {
        main: {
            adr: account.address.toLowerCase(),
            ks: ks
        },
        test: {
            adr: account.address.toLowerCase(),
            ks: ks
        }
    }

    if(process.argv[4]){
        console.log(account);
        console.log("---------------------------------");
        console.log(ks);
        return;
    }

    const obj = "export default " + JSON.stringify(w);

    fs.writeFile('./secrets/accounts.js', obj, (err)=> {
        if (err) return console.log(err);
        console.log("keystore created. Share this wallet address with your co-signers: "+account.address.toLowerCase());
    });
}

createAccount();