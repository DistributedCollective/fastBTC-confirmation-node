import rskCtrl from '../controller/rskCtrl';

const txIdArg = process.argv[4] ? process.argv[4] : process.argv[3];

let txIds = txIdArg.split(",");

console.log("txids", txIds);


async function confirmTx(id) {
    console.log("Confirm tx id "+id)
    const tx = await rskCtrl.confirmWithdrawRequest(id)
    console.log(tx);
}


(async () => {
    console.log("Initializing RSK");
    await rskCtrl.init();

    for (let txId of txIds) {
       await confirmTx(txId);
    }
})();
