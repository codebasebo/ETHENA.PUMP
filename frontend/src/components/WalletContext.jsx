import React, { createContext, useState, useContext } from 'react';
import { ethers } from 'ethers';
import { connectWallet as connectWalletUtil, disconnectWallet as disconnectWalletUtil } from './wallet';

const WalletContext = createContext();

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);

    async function connectWallet() {
        if (typeof window.ethereum !== 'undefined') {
            try {
                await window.ethereum.request({ method: 'eth_requestAccounts' });
                const provider = new ethers.BrowserProvider(window.ethereum);
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setAccount(address); // Set the account address
                return provider; // Return the provider
            } catch (error) {
                console.error("User rejected connection:", error);
                return null; // Or throw an error
            }
        } else {
            console.error("MetaMask not detected");
            return null;
        }
    }

    const connectToNetwork = async () => {
        try {
            await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                    chainId: "0xaa36a7",
                    nativeCurrency: {
                        name: "Sepolia Ether",
                        symbol: "SEP", // This is correct.
                        decimals: 18
                    },
                    rpcUrls: ['https://rpc.sepolia.org'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io']
                }]
            });
            console.log("Connected to the Sepolia Test Network");
        } catch (error) {
            console.error("Failed to switch network", error);
        }
    };

    const handleConnectWallet = async () => {
        try {
            await connectToNetwork(); // Switch to Sepolia network
            const provider = await connectWallet();
            if (provider) {
                const signer = await provider.getSigner();
                const address = await signer.getAddress();
                setAccount(address); // Set the account address
            }
        } catch (error) {
            if (error.code === -32002) {
                console.error("Already processing eth_requestAccounts. Please wait.");
            } else {
                console.error("Failed to connect wallet:", error);
            }
        }
    };

    const handleDisconnectWallet = () => {
        disconnectWalletUtil();
        setAccount(null); // Clear the account
    };

    return (
        <WalletContext.Provider value={{ account, handleConnectWallet, handleDisconnectWallet }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => useContext(WalletContext);
