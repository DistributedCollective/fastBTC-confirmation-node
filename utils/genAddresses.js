import {bip32, networks, payments} from "bitcoinjs-lib";
import conf from '../config/config';
const fs = require('fs')

const network = conf.network === 'main' ? networks.bitcoin : networks.testnet;


function getDerivedPubKeys(pubKeys, index) {
    let publicKeys = pubKeys.map(key => {
        const node = bip32.fromBase58(key, network);
        const child = node.derive(0).derive(index);
        return child.publicKey.toString('hex');
    });
    publicKeys.sort();
    publicKeys = publicKeys.map(k => Buffer.from(k, 'hex'));
    return publicKeys;
}


const getAddresses = () => {
    const addresses = [];
    for(let i = 0; i < 1000; i++){
        const publicKeys = getDerivedPubKeys(conf.walletSigs.pubKeys, i);
    
        const payment = payments.p2sh({
            network: network,
            redeem: payments.p2ms({
                m: conf.walletSigs.cosigners,
                pubkeys: publicKeys,
                network: network
            })
        });

        addresses.push(payment.address)
    }
    console.log(addresses);
    return addresses;
}


const createGenBtcAddresses = () => {
    const adr = getAddresses();
    fs.writeFile(
        __dirname + '/../db/genBtcAddresses.json',
        JSON.stringify(adr),
        error => {
            if (error) {
                console.log('Error writing genBtcAddresses.json =', error)
            }
        }
    )
}


createGenBtcAddresses();
