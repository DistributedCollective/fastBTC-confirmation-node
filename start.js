/**
* Detects and confirms withdraw requests on the managed wallet contract
*/
import conf from './config/config';
const express= require('express');
const app = express();
const http = require('http').createServer(app);
const io = require("socket.io-client"); 
import MainCtrl from './controller/main';

const socket = io("http://127.0.0.1:3007", {
  reconnectionDelayMax: 10000,
//   auth: {
//     token: "123"
//   },
//   query: {
//     "my-key": "my-value"
//   }
});

console.log("Hola. Starting confirmation node on "+conf.network);
       
/*
http.listen(conf.serverPort, () => {
    console.log('listening on *:'+conf.serverPort);
});
*/


MainCtrl.start();