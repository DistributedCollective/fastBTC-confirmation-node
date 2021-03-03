import MainCtrl from '../controller/main';



async function start() {
    await MainCtrl.init();
    const payment = await MainCtrl.getPayment(93);
    console.log(payment)
}

start();
