import mainCtrl from '../controller/main';

const user = {
    web3adr: 'webadrRocks',
    btcadr: '2MyxF7QnW8MdV8xMiYcPuM5NUH4ZBVYXAQU',
    label: 'userlabel',
    dateAdded: new Date()
}

const tx = {
    userAdrLabel: 'userlabel',
    txHash: '724f5870e5f85cb8e643bfdefd707f08afdfa4f0109c166eca4d07661fb6a1c9',
    txId: '1',
    valueBtc: '0.1',
    dateAdded: new Date(),
    status: 'confirmed',
    type: 'transfer'
}


export default async function storeWithdrawRequest() {
    console.log("Store confirmed withdraw request.\nInitializing Main Controller");
    await mainCtrl.init();
    const sign = await mainCtrl.createSignature();

    const stored = await mainCtrl.storeWithdrawRequest(user, tx, 1, sign);
    console.log(stored);
}

storeWithdrawRequest();