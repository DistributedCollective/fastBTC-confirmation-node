import rskCtrl from '../controller/rskCtrl';


async function confirmTx(id) {
    console.log("Initializing RSK");
    await rskCtrl.init();

    console.log("Confirm tx id "+id)
    const tx = await rskCtrl.confirmWithdrawRequest(id)
    console.log(tx);
}

const txId = process.argv[4]?process.argv[4]:process.argv[3];
confirmTx(txId);