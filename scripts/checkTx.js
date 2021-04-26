import rskCtrl from '../controller/rskCtrl';


async function checkTx(id) {
    console.log("Initializing RSK");
    await rskCtrl.init();

    console.log("Checking tx "+id);
    const confirmationCount = await rskCtrl.getConfirmationCount(id);
    const getConfirmations = await rskCtrl.getConfirmations(id);
    console.log('-'.repeat(50));
    console.log('Confirmation count: ', confirmationCount);
    console.log('Confirmers: ', getConfirmations);
}

const txId = process.argv[4]?process.argv[4]:process.argv[3];
checkTx(txId);
