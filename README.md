# FastBtc confirmation node

## General description
A n:m multisig* administrates RBtc withdrawals of the managed wallet smart contract** on Rsk. Each of the key holders run a fastBTC confirmation node****. One main node*** initates the withrawal and n confirmation nodes confirm the transaction.
The main node monitors the BTC multisignature addresses for incoming deposits. As soon as a deposit is recognized and confirmed, it is submitting a transaction to the multisig, requesting an equivalent payout from the smart contract. This transaction is emitting a submission event.
  
The  confirmation nodes listen for submission events. As soon as one is emitted, they verify that  
- the Bitcoin address is indeed derived from the BTC multisig,
- the Btc deposit transaction hash is valid, recent (work in progress) and contains the correct Btc address
- the submission was made by the main node (work in progress)

If all checks were successful, they confirm the transaction on the multisig contract. On the last confirmation, the withdrawal is executed.
To avoid failing transactions, the master node assigns a delay to the confirmation nodes.

```
* https://github.com/DistributedCollective/Sovryn-smart-contracts/blob/development/contracts/multisig/MultiSigWallet.sol
** https://github.com/DistributedCollective/ManagedWallet/blob/master/contracts/ManagedWallet.sol
*** https://github.com/DistributedCollective/FastBTC
**** https://github.com/DistributedCollective/fastBTC-confirmation-node
```


### Requirements

NodeJs > 12.1  
 

### Install

Create directory "secrets" and within a file accounts.js with the credentials of the admin wallet of the confirmation node

```
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

You can also choose to encrypt your wallet to V3 keystore format. If you do so, append your encryption password when running the start command as parameter:

```
npm run start:main yourpassword
``` 
`accounts.js` it should then look like:

```sh
export default {
    "test": {
        adr: "0x..."
        ks: : {Ethereum-v3-keystore}    
    },
    "main": {
        adr: "0x..."
        ks: {Ethereum-v3-keystore}
    }
}
```


Charge your wallet with enough funds to cover transaction costs. We suggest 0.01 RBtc.
First confirmation-tx cost ~ 0.24$
Last confirmation-tx cost ~ 0.39$

Add the public keys of the Btc multisig cosigners and the number of required signatures into secrets/walletSigs.main.js for mainnet and
secrets/walletSigs.test.js for testnet.
In case you run only the testnetwork add walletSigs.main.js with the example data below.

```
export default {
    pubKeys: [
        "tpub...",
        "tpub...",
        "tpub..."
    ],
    cosigners:2
} 
```

Run 
```
npm run genAddresses:[main | test] 
```
to generate deposit addresses based on the Btc multisig.


Set the master node ip+port and the multisig contract address on Rsk in config/[config_mainnet | config_testnet].



To receive notifications on telegram about new transactions and errors create a telegram bot-token-id and write in in a file /secrets/telegram.js
```sh
export default "[telegram-bot-token]";
export default ""; for no notifications
```

Install all dependencies with

`npm i`


### Start

`npm run start:[test|main]`