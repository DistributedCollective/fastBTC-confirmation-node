import rskCtrl from './controller/rskCtrl';

async function tryDecrypt(id) {
    console.log("Initializing RSK");
    await rskCtrl.init();

    const acco = rskCtrl.web3.eth.accounts.create('dsafasdfasdfasdfasdf');
    const encrypted = rskCtrl.web3.eth.accounts.encrypt(acco.privateKey, 'asdfasdf');
    console.log("here1", new Date());
    const decrypted = rskCtrl.web3.eth.accounts.decrypt(encrypted, 'asdfasdf');
    console.log("here2", new Date());
}

tryDecrypt();
