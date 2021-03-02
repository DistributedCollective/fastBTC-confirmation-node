import MainCtrl from '../controller/main';

async function start() {
    const verified = await MainCtrl.verifyPaymentInfo(
            "2MwUckEwJxfezMT8prUfNYX9x5uVd1sEaXj", "0xebc083240426d011d2e50ce256dea08d391416202634ade1cf787621646d269f" 
    );
}

start();
