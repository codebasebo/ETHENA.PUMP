import React, { useState } from 'react';
import '../Navbar.css';
import { useWallet } from './WalletContext';

const Navbar = () => {
    const { account, handleConnectWallet, handleDisconnectWallet } = useWallet();
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        if (loading) return; // Prevent multiple clicks
        setLoading(true);
        try {
            await handleConnectWallet();
        } catch (error) {
            console.error("Failed to connect wallet:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <nav className="navbar">
            <h1>ETHENA.PUMP</h1>
            <button
                className="nav-button connect-button"
                onClick={account ? handleDisconnectWallet : handleConnect}
                disabled={loading} // Disable button while loading
            >
                {loading ? 'Connecting...' : account
                    ? `Disconnect: ${typeof account === 'string' ? `${account.substring(0, 6)}...${account.substring(account.length - 4)}` : 'Connected'}`
                    : '[connect wallet]'}
            </button>
        </nav>
    );
};

export default Navbar;