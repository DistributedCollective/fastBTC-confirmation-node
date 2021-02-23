/**
* Detects and confirms withdraw requests on the managed wallet contract
*/
import conf from './config/config';
const express= require('express');
const app = express();
const http = require('http').createServer(app);
import MainCtrl from './controller/main';

// setting socket
const socket = require('socket.io-client')(conf.masterNode);
let delay = 0;

socket.on('connect', () => {
  console.log("Connected to socket")

  // a consigner is the slave node watching for withdraw requests that need confirmation
  socket.emit('getConsignerIndex', null, (data) => {
    console.log("My index as consigner is " + data);
  });
  socket.emit('getDelay', null, (data) => {
    delay = data;
    console.log("My delay is " + delay);
  });
});

socket.on('disconnect', function(){
  console.log("Disconnected from socket")
});

console.log("Hola. Starting confirmation node on "+conf.network);
       
/*
http.listen(conf.serverPort, () => {
    console.log('listening on *:'+conf.serverPort);
});
*/


MainCtrl.start();

export default delay