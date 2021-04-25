/**
 * Manual rBtc transfer for transfers outside the limit
 */

 import conf from '../config/config';
 import rskCtrl from '../controller/rskCtrl';
 
 /**
  * amount in sats
  */
 async function transfer(to, amount) {
     console.log("init rsk");
     await rskCtrl.init(conf);
 
     const pKey = conf.account.pKey || rskCtrl.web3.eth.accounts.decrypt(conf.account.ks, process.argv[3]).privateKey;
    rskCtrl.web3.eth.accounts.wallet.add(pKey);
       

     const val = rskCtrl.web3.utils.toWei(amount, "Ether");
 
     const receipt = await rskCtrl.web3.eth.sendTransaction({
         from: conf.account.adr,
         to: to,
         value: val,
         gas: 25000
     });
     
     if (receipt.transactionHash) console.log("Successfully transferred " + amount + " to " + to);
     else console.log("Error on transfer");
     
     console.log(receipt);
 }
 
 const to = process.argv[4]?process.argv[4]:process.argv[3];

 transfer(to, "0.000001"); 