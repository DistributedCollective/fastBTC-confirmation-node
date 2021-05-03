import rskCtrl from '../controller/rskCtrl';
import mainCtrl from '../controller/main';
import conf from '../config/config';

async function getUnconfirmedTx(id) {
    console.log("Initializing RSK");
    await rskCtrl.init();

    const numberOfTransactions = await mainCtrl.getNrOfTx();
    console.log("Number of pending transactions", numberOfTransactions);
    let from = conf.startIndex;

    for (let txID = from; txID < numberOfTransactions; txID++) {
        const isProcessed = await checkIfProcessed(txID);
        if(!isProcessed) console.log(txID);
    }


}

getUnconfirmedTx();
//getTxInfo(6423);


async function getTxInfo(txId) {
    console.log("Initializing RSK");
    await rskCtrl.init();

   const txInfo = await rskCtrl.multisig.methods["transactions"](txId).call();
   console.log(txInfo);
   
}


async function checkIfProcessed(txId){
    let cnt=0;
    while(true){
        try{
            const isConfirmed = await rskCtrl.multisig.methods["isConfirmed"](txId).call();
            const txObj = await rskCtrl.multisig.methods["transactions"](txId).call();
            //console.log(txId+": is confirmed: "+isConfirmed+", is executed: "+txObj.executed);

            return isConfirmed || txObj.executed;
        }
        catch(e){
            console.error("Error getting confirmed info");
            console.error(e);
            cnt++;

            if(cnt==5) return true; //need to be true so the same tx is not processed again
            continue;
        }
    }
}