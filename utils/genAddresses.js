import {bip32, networks, payments} from "bitcoinjs-lib";
import conf from '../config/config';
const fs = require('fs')

const addresses = []
const network = conf.network === 'prod' ? networks.bitcoin : networks.testnet;


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
    for(let i = 0; i < 10000; i++){
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
    console.log(addresses)
}


const createGenBtcAddresses = () => {
    getAddresses();
    fs.writeFile(
        __dirname + '/../db/genBtcAddresses.json',
        JSON.stringify(addresses),
        error => {
            if (error) {
                console.log('Error writing genBtcAddresses.json =', error)
            }
        }
    )
}

fs.readFile(__dirname + '/../db/genBtcAddresses.json', (error, data) => {
    if (error) {
        console.log("We need to create genBtcAddresses.json")
        createGenBtcAddresses();
    } else {
        if (data) {
            console.log('The genBtcAddresses.json has already been created')
        } else {
            createGenBtcAddresses();
        }
    }
});
