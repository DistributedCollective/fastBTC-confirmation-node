import Web3 from 'web3';

const multisigAbi = [
    {
        "inputs": [
            {
                "internalType": "address[]",
                "name": "_owners",
                "type": "address[]"
            },
            {
                "internalType": "uint256",
                "name": "_required",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "Confirmation",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            }
        ],
        "name": "Deposit",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "Execution",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "ExecutionFailure",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnerAddition",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnerRemoval",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "uint256",
                "name": "required",
                "type": "uint256"
            }
        ],
        "name": "RequirementChange",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "sender",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "Revocation",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "Submission",
        "type": "event"
    },
    {
        "payable": true,
        "stateMutability": "payable",
        "type": "fallback"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "MAX_OWNER_COUNT",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "addOwner",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_required",
                "type": "uint256"
            }
        ],
        "name": "changeRequirement",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "confirmTransaction",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "confirmations",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "executeTransaction",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "getConfirmationCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "count",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "getConfirmations",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "_confirmations",
                "type": "address[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "getOwners",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "bool",
                "name": "pending",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "executed",
                "type": "bool"
            }
        ],
        "name": "getTransactionCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "count",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "from",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "to",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "pending",
                "type": "bool"
            },
            {
                "internalType": "bool",
                "name": "executed",
                "type": "bool"
            }
        ],
        "name": "getTransactionIds",
        "outputs": [
            {
                "internalType": "uint256[]",
                "name": "_transactionIds",
                "type": "uint256[]"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "isConfirmed",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "isOwner",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "owners",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "removeOwner",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            },
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "replaceOwner",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "required",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "name": "revokeConfirmation",
        "outputs": [],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": false,
        "inputs": [
            {
                "internalType": "address",
                "name": "destination",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            }
        ],
        "name": "submitTransaction",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "transactionId",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [],
        "name": "transactionCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    },
    {
        "constant": true,
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "transactions",
        "outputs": [
            {
                "internalType": "address",
                "name": "destination",
                "type": "address"
            },
            {
                "internalType": "uint256",
                "name": "value",
                "type": "uint256"
            },
            {
                "internalType": "bytes",
                "name": "data",
                "type": "bytes"
            },
            {
                "internalType": "bool",
                "name": "executed",
                "type": "bool"
            }
        ],
        "payable": false,
        "stateMutability": "view",
        "type": "function"
    }
]

const conf = {
    masterNode: 'http://3.131.33.161:3000/',
    rskNodeProvider: 'https://mainnet.sovryn.app/rpc',
    multisigAddress: "0x0f279e810B95E0d425622b9b40D7bCD0B5C4B19d",
};

const web3 = new Web3(conf.rskNodeProvider);
const multisig = new web3.eth.Contract(multisigAbi, conf.multisigAddress);


async function wasteTime(s) {
    return this.wasteTimeMs(s * 1000);
}

async function wasteTimeMs(ms) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, ms);
    });
}

async function getNrOfTx() {
    while (true) {
        try {
            const numberOfTransactions = await multisig.methods["getTransactionCount"](true, true).call();
            if (!numberOfTransactions) {
                await wasteTime(5)
                continue;
            }
            return numberOfTransactions;
        } catch (e) {
            console.error("Error getting transaction count");
            console.error(e);
            await wasteTime(5)
        }
    }
}


async function getUnconfirmedTx(id) {
    const numberOfTransactions = await getNrOfTx();
    console.log("Number of pending transactions", numberOfTransactions);
    let from = conf.startIndex;

    for (let txID = from; txID < numberOfTransactions; txID++) {
        const isProcessed = await checkIfProcessed(txID);
        if (!isProcessed) {
            console.log(txID);
        }
    }
}

async function getTxInfo(txId) {
    const txInfo = await multisig.methods["transactions"](txId).call();
    console.log(txInfo);
}

async function checkIfProcessed(txId) {
    let cnt = 0;
    while (true) {
        try {
            const isConfirmed = await multisig.methods["isConfirmed"](txId).call();
            const txObj = await multisig.methods["transactions"](txId).call();
            //console.log(txId+": is confirmed: "+isConfirmed+", is executed: "+txObj.executed);

            return isConfirmed || txObj.executed;
        } catch (e) {
            console.error("Error getting confirmed info");
            console.error(e);
            cnt++;

            if (cnt === 5) {
                return true;
            } //need to be true so the same tx is not processed again
        }
    }
}

getUnconfirmedTx();
getTxInfo(12312);
