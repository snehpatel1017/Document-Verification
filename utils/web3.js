import Web3 from 'web3';

let web3;

if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
    // We are in the browser and MetaMask is running
    web3 = new Web3(window.ethereum);
} else {
    // We are on the server OR the user is not running MetaMask
    const provider = new Web3.providers.HttpProvider(
        'https://testnet.hashio.io/api' //  Hedera Testnet RPC endpoint
    );
    web3 = new Web3(provider);
}

export const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
        try {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            return true;
        } catch (error) {
            console.error("User denied account access");
            return false;
        }
    } else {
        console.error("MetaMask is not installed");
        return false;
    }
};

export const getCurrentAccount = async () => {
    const accounts = await web3.eth.getAccounts();
    console.log("Current account:", accounts);
    return accounts[0];
};

export default web3;
