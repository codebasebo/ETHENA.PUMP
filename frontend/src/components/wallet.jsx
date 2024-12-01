import { ethers } from 'ethers';

export const connectWallet = async () => {
    if (window.ethereum) {
        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            console.log('Wallet connected:', signer);
            return signer;
        } catch (error) {
            console.error('Failed to connect wallet:', error);
        }
    } else {
        console.error('No Ethereum provider found. Install MetaMask.');
    }
    return null;
};




export const disconnectWallet = () => {
    return null; // Simply clear the account to "disconnect"
};
