import MainCtrl from '../controller/main';



async function start() {
    await MainCtrl.init();
    const verified = await MainCtrl.verifyPaymentInfo(
            "2MwUckEwJxfezMT8prUfNYX9x5uVd1sEaXj", "c7eb71703d2ed0c55483bf5cf60a3b0ca1214b08c79b81ba5d6f5f37daecf9a7" 
    );
}

start();
