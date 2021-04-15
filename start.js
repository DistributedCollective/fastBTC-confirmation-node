/**
* Detects and confirms withdraw requests on the managed wallet contract
*/


import conf from './config/config';
import MainCtrl from './controller/main';

console.log("Hola. Starting confirmation node on "+conf.network);       

async function start(){
    await MainCtrl.init();
    await MainCtrl.pollAndConfirmWithdrawRequests();
}

start().catch(e => {
    console.error("An error was thrown from the main loop", e);
}).then(() => {
    console.log("Bye!");
});
