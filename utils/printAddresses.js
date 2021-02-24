import conf from '../config/config';
import { bip32, networks, payments } from "bitcoinjs-lib";



const pubKeys = [
            //account.neutered().toBase58(),
            ...conf.walletSigs.pubKeys
        ];

const network = networks.bitcoin;




async function getPaymentAdr(index) {
    const publicKeys = pubKeys.map(key => {
        const node = bip32.fromBase58(key, network);
        const child = node.derive(0).derive(index);
        return child.publicKey;
    });

    const payment = payments.p2wsh({
        network: network,
        redeem: payments.p2ms({
            m: 2,
            pubkeys: publicKeys,
            network: network
        })
    });

    return { payment, publicKeys };
}

export default async function printAddresses(){
    //await dbCtrl.initDb("fastbtcrelay_main");
    //await bitcoinCtrl.init();
     
    for(let i = 0; i < 130; i++){
        const {payment: userPayment} = await getPaymentAdr(i);
        console.log(i+" "+userPayment.address);
    }
}
