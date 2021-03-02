import rskCtrl from '../controller/rskCtrl';


async function start() {
    console.log("Getting Cosigners.\nInitializing RSK");
    await rskCtrl.init();
    const cosigners = await rskCtrl.multisig.methods["getOwners"]().call()
    console.log(cosigners);
}

start();