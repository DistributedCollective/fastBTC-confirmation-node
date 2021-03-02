import MainCtrl from '../controller/main';


console.log("test")


async function start() {
    const verified = await MainCtrl.verifyPaymentInfo(
            { btcAdr: "2MwUckEwJxfezMT8prUfNYX9x5uVd1sEaXj", txHash: "0xebc083240426d011d2e50ce256dea08d391416202634ade1cf787621646d269f" 
    });
}

start();
