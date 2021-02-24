/**
* Detects and confirms withdraw requests on the managed wallet contract
*/
import conf from './config/config';
import MainCtrl from './controller/main';
const socket = require('socket.io-client')(conf.masterNode);

console.log("Hola. Starting confirmation node on "+conf.network);       
MainCtrl.start(socket);

export default 0