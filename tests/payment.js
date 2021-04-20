import MainCtrl from '../controller/main';
import dbCtrl from "../controller/dbCtrl";
import conf from '../config/config';

const assert = require('assert');
let txHash="";

describe("MainCtrl", async () => {
    before(async () => {
        await MainCtrl.init();
        await dbCtrl.initDb(conf.db);
        txHash = Math.random().toString();
    });

    it('should receive a tx hash and btc address from an already initiated withdraw request from the master node', async () => {
        const payment = await MainCtrl.getPayment(100);
        console.log(payment)
        assert(payment.btcAdr && payment.txHash)
    });

    it('should receive null values as btcAdr and txHash for an invalid txId from the master node', async () => {
        const payment = await MainCtrl.getPayment(-1);
        console.log(payment)
        assert(!payment.btcAdr && !payment.txHash)
    });

    /*
    it('verification should return true if executed the first time', async () => {
        const payment = await MainCtrl.verifyPaymentInfo('2MwUckEwJxfezMT8prUfNYX9x5uVd1sEaXj','2ac7c35a3259a418f907089face8d40a1f4440860549e7d6135a0629744c9451');
        console.log(payment);
        assert(payment);
    });*/
 
    it('should return false because verified before', async () => {
        const payment = await MainCtrl.verifyPaymentInfo('2MwUckEwJxfezMT8prUfNYX9x5uVd1sEaXj','2ac7c35a3259a418f907089face8d40a1f4440860549e7d6135a0629744c9451');
        console.log(payment);
        assert(!payment);
    });

    /*
    it('should add a payment info to db', async () => {
        const addedPayment = await dbCtrl.addPaymentTx(txHash, 100, new Date(Date.now()));
        console.log(addedPayment)
        assert(addedPayment);
    });*/

    it('should return true because payment is already in db', async () => {
        const addedPayment = await dbCtrl.getPayment(txHash);
        console.log(addedPayment)
        assert(addedPayment);
    });
   
    it('should return false because payment is not yet in the db', async () => {
        const addedPayment = await dbCtrl.getPayment("cafe");
        console.log(addedPayment)
        assert(!addedPayment);
    });
});