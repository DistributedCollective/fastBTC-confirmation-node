import { bip32, networks, payments } from "bitcoinjs-lib";
import conf from '../config/config';
const fs = require('fs')

const addresses = []
const network = conf.network === 'prod' ? networks.bitcoin : networks.testnet;

const getAddresses = () => {
    for (let i = 0; i < 100000; i++) {
        const publicKeys = conf.walletSigs.pubKeys.map(key => {
            const node = bip32.fromBase58(key, network);
            const child = node.derive(0).derive(i);
            return child.publicKey;
        });

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
    console.log(addresses.length+" addresses generated");
}

getAddresses();
fs.writeFile('./db/genBtcAddresses.json',
    JSON.stringify(addresses),
    error => {
        if (error) {
            console.error('Error writing genBtcAddresses.json =', error)
        }
        else console.log("addresses stored");
    }
);
