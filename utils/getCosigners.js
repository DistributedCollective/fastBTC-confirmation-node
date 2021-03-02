import rskCtrl from '../controller/rskCtrl';


export default async function getCosigners() {
    console.log("Getting Cosigners.\nInitializing RSK");
    await rskCtrl.init();

    try {
        const cosigners = await rskCtrl.multisig.methods["getOwners"]().call()
    
        console.log("\nCosigners are", cosigners);
        return cosigners;
    } catch (e) {
        console.log("\nError getting cosigners", e)
        return null;
    }
}
