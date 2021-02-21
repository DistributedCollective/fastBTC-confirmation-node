/**
* Detects and confirms withdraw requests on the managed wallet contract
*/
import conf from './config/config';
const express= require('express');
const app = express();
const http = require('http').createServer(app);
import MainCtrl from './controller/main';

console.log("Hola. Starting confirmation node on "+conf.network);


http.listen(conf.serverPort, () => {
    console.log('listening on *:'+conf.serverPort);
});


MainCtrl.start(http);