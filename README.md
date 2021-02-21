# FastBtc confirmation node

## General description
A 3 out of 5 multisig is the owner of the backend contract. Each of the key holders runs a fastBTC node. There will be one main node (fast-btc-repo) and 4 confirmation nodes (fast-btc-confirmationnode-repo). 
  
The main node monitors the BTC multisignature addresses for incoming deposits. As soon as a deposit is recognized and confirmed, it is submitting a transaction to the multisig, requesting an equivalent payout from the smart contract. This transaction is emitting a submission event.
  
The  confirmation nodes listen for submission events. As soon as one is emitted, they verify that 
- a deposit was made on the bitcoin address linked to the receiver’s RSK address, 
- the bitcoin address is indeed derived from the BTC multisig,
- the amount of the payout is correct,
- the submission was made by the main node.

If all four checks are successful, they confirm the transaction on the multisig contract. On the third confirmation, the transaction is executed immediately.

To save transaction costs, the confirmation nodes introduce a delay. Every node has an index. Nodes with index > 2 wait for the specified time after receiving a submission event. After the time passed, they read the state of the submission from the multisig contract. If it was not yet executed, they send a confirmation transaction.


### Requirements

NodeJs > 12.1  
 


### Install

Create directory "secrets" and within a file accounts.js with the credentials of the admin wallet of the confirmation node

```sh
export default {
    "test": {
        adr: "0x..."
        pKey: ""
    },
    "main": {
        adr: "0x..."
        pKey: ""
    }
}
```

You can also choose to encrypt your wallet. If you do so, remember to add your encryption password when running the start command like so:

```
npm run start:main yourpassword
``` 
`accounts.js` it should then look like:

```sh
export default {
    "test": {
        adr: "0x..."
        ks: {
            version: 3,
            id: '',
            address: '',
            crypto: {
              ciphertext: '',
              cipherparams: { iv: '' },
              cipher: '',
              kdf: '',
              kdfparams: {
                dklen: xx,
                salt: '',
                n: xxxx,
                r: x,
                p: x
              },
              mac: ''
            }
        }    },
    "main": {
        adr: "0x..."
        ks: {...}
    }
}
```

To receive notifications on telegram about new transactions and errors create a telegram bot-token-id and write in in a file /secrets/telegram.js
```sh
export default "[telegram-bot-token]";
export default ""; for no notifications
```

Install all dependencies with

`npm i`


### Start


### improvements:

Create an easy executable?
https://medium.com/jspoint/how-to-create-an-executable-exe-file-from-javascript-code-using-node-js-45154ba4de20
https://dev.to/jochemstoel/bundle-your-node-app-to-a-single-executable-for-windows-linux-and-osx-2c89

test out electrum using our btc-node