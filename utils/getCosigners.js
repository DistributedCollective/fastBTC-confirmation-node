import rskCtrl from '../controller/rskCtrl';
import conf from '../config/config';

const from ={
    adr: "",
    pKey: ""
};


export default async function getCosigners() {
    console.log("Getting Cosigners.\n Initializing RSK");
    await rskCtrl.init();

    const pKey = rskCtrl.web3.eth.accounts.decrypt(from.ks, process.argv[3]).privateKey;
    rskCtrl.web3.eth.accounts.wallet.add(pKey);

    this.web3.eth.abi.encodeFunctionCall({
        name: 'getOwners',
        type: 'function',
    });

    const cosigners = await rskCtrl.multisig.methods.submitTransaction(conf.contractAddress, 0, data).send({
        from: from.adr,
        gas: 100000
    });

    console.log("Cosigners are", cosigners);
    return cosigners;
}
