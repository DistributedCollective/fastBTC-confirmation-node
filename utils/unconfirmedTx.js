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
        const isProcessed = await mainCtrl.checkIfProcessed(txID);
    }


}

getUnconfirmedTx();

