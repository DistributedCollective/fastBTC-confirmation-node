import rskCtrl from '../controller/rskCtrl';
import conf from '../config/config';

const from ={
    adr: "",
    pKey: ""
};


export default async function getCosigners() {
    console.log("Getting Cosigners.\nInitializing RSK");
    await rskCtrl.init();

    const pKey = conf.account.pKey || rskCtrl.web3.eth.accounts.decrypt(conf.account.ks, process.argv[3]).privateKey;
    rskCtrl.web3.eth.accounts.wallet.add(pKey);

    const data = rskCtrl.web3.eth.abi.encodeFunctionCall({
        name: 'getOwners',
        type: 'function',
        inputs: []
    }, []);

    try {
        const cosigners = await rskCtrl.multisig.methods.submitTransaction(conf.multisigAddress, 0, data).send({
            from: conf.account.adr,
            gas: 100000
        });
    
        console.log("\nCosigners are", cosigners);
        return cosigners;
    } catch (e) {
        console.log("\nError getting cosigners")
        return null;
    }
}
