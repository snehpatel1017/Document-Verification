import web3 from './web3';


// Replace with your contract ABI and address

const MAIN_ABI = [
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint64",
                "name": "adhaarId",
                "type": "uint64"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "viewer",
                "type": "address"
            }
        ],
        "name": "AccessGranted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint64",
                "name": "adhaarId",
                "type": "uint64"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "viewer",
                "type": "address"
            }
        ],
        "name": "AccessRevoked",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint64",
                "name": "adhaarId",
                "type": "uint64"
            },
            {
                "indexed": false,
                "internalType": "string",
                "name": "ipfsHash",
                "type": "string"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "uploader",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "enum Main.CredentialType",
                "name": "credentialType",
                "type": "uint8"
            }
        ],
        "name": "DocumentStored",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint64",
                "name": "adhaarId",
                "type": "uint64"
            },
            {
                "indexed": false,
                "internalType": "address",
                "name": "verifier",
                "type": "address"
            },
            {
                "indexed": false,
                "internalType": "enum Main.CredentialType",
                "name": "credentialType",
                "type": "uint8"
            }
        ],
        "name": "DocumentVerified",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "uint64",
                "name": "adhaarId",
                "type": "uint64"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "studentAddress",
                "type": "address"
            }
        ],
        "name": "StudentRegistered",
        "type": "event"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "_adhaarId",
                "type": "uint64"
            }
        ],
        "name": "GetAllDocs",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "adhaarId",
                        "type": "uint64"
                    },
                    {
                        "internalType": "string",
                        "name": "ipfsHash",
                        "type": "string"
                    },
                    {
                        "internalType": "address",
                        "name": "uploader",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "uploaderName",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "dateUploaded",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "verified",
                        "type": "bool"
                    },
                    {
                        "internalType": "enum Main.CredentialType",
                        "name": "credentialType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "institutionName",
                        "type": "string"
                    }
                ],
                "internalType": "struct Main.Document[]",
                "name": "",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "_adhaarId",
                "type": "uint64"
            },
            {
                "internalType": "enum Main.CredentialType",
                "name": "_type",
                "type": "uint8"
            }
        ],
        "name": "GetDocByType",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint64",
                        "name": "adhaarId",
                        "type": "uint64"
                    },
                    {
                        "internalType": "string",
                        "name": "ipfsHash",
                        "type": "string"
                    },
                    {
                        "internalType": "address",
                        "name": "uploader",
                        "type": "address"
                    },
                    {
                        "internalType": "string",
                        "name": "uploaderName",
                        "type": "string"
                    },
                    {
                        "internalType": "string",
                        "name": "dateUploaded",
                        "type": "string"
                    },
                    {
                        "internalType": "bool",
                        "name": "verified",
                        "type": "bool"
                    },
                    {
                        "internalType": "enum Main.CredentialType",
                        "name": "credentialType",
                        "type": "uint8"
                    },
                    {
                        "internalType": "string",
                        "name": "institutionName",
                        "type": "string"
                    }
                ],
                "internalType": "struct Main.Document",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_ipfsHash",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_uploadDate",
                "type": "string"
            },
            {
                "internalType": "uint64",
                "name": "_adhaarId",
                "type": "uint64"
            },
            {
                "internalType": "string",
                "name": "_uploader",
                "type": "string"
            },
            {
                "internalType": "enum Main.CredentialType",
                "name": "_type",
                "type": "uint8"
            },
            {
                "internalType": "string",
                "name": "_institutionName",
                "type": "string"
            }
        ],
        "name": "StoreDocument",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "_adhaarId",
                "type": "uint64"
            },
            {
                "internalType": "address",
                "name": "_viewer",
                "type": "address"
            }
        ],
        "name": "grantAccess",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "_adhaarId",
                "type": "uint64"
            }
        ],
        "name": "getDocumentCount",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getMyAdhaarId",
        "outputs": [
            {
                "internalType": "uint64",
                "name": "",
                "type": "uint64"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "_adhaarId",
                "type": "uint64"
            }
        ],
        "name": "hasDocuments",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "_adhaarId",
                "type": "uint64"
            },
            {
                "internalType": "enum Main.CredentialType",
                "name": "_type",
                "type": "uint8"
            }
        ],
        "name": "hasDocumentOfType",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "_adhaarId",
                "type": "uint64"
            },
            {
                "internalType": "address",
                "name": "_viewer",
                "type": "address"
            }
        ],
        "name": "hasViewAccess",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_instituteAddress",
                "type": "address"
            }
        ],
        "name": "instiVerification",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "institute",
        "outputs": [
            {
                "internalType": "uint8",
                "name": "",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "_adhaarId",
                "type": "uint64"
            }
        ],
        "name": "registerStudent",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint64",
                "name": "_adhaarId",
                "type": "uint64"
            },
            {
                "internalType": "address",
                "name": "_viewer",
                "type": "address"
            }
        ],
        "name": "revokeAccess",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_newHash",
                "type": "string"
            },
            {
                "internalType": "uint64",
                "name": "_adhaar",
                "type": "uint64"
            },
            {
                "internalType": "enum Main.CredentialType",
                "name": "_type",
                "type": "uint8"
            }
        ],
        "name": "verify",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
]



// Replace with your deployed contract address
const MAIN_CONTRACT_ADDRESS = '0xdd1b057897f5fc065748d6e82160024631069c22';

export const mainContract = new web3.eth.Contract(
    MAIN_ABI,
    MAIN_CONTRACT_ADDRESS
);
