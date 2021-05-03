import {bip32, networks, payments} from "bitcoinjs-lib";
var b58 = require('bs58check')
import conf from '../config/config';
const fs = require('fs')

const network = conf.network === 'main' ? networks.bitcoin : networks.testnet;
console.log("network: "+conf.network);
console.log(network);

function getDerivedPubKeys(pubKeys, index) {
    let publicKeys = pubKeys.map(key => {
        const k = zpubToXpub(key);
        const node = bip32.fromBase58(k, network);
        const child = node.derive(0).derive(index);
        return child.publicKey.toString('hex');
    });
    publicKeys.sort();
    publicKeys = publicKeys.map(k => Buffer.from(k, 'hex'));
    return publicKeys;
}

function zpubToXpub(zpub) {
    var data = b58.decode(zpub)
    data = data.slice(4)
    data = Buffer.concat([Buffer.from('0488b21e','hex'), data])
    return b58.encode(data)
  }

const getAddresses = () => {
    const addresses = [];
    for(let i = 0; i < 100; i++){
        const publicKeys = getDerivedPubKeys(conf.walletSigs.pubKeys, i);
    
        const payment = payments.p2wsh({
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
