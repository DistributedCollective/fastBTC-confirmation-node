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


socket.on('connect', () => {
  console.log("Connected to socket")

  // a consigner is the slave node watching for withdraw requests that need confirmation
  socket.emit('getConsignerIndex');
});

socket.on('receiveConsignerIndex', (data) => {
  console.log("My index as consigner is " + data);
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