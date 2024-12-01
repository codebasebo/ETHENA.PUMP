import React, { useState } from 'react';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { abi } from './abi';
import { ethers } from 'ethers';
import { usdeAbi } from './usdeAbi';
import Navbar from './Navbar';
import { useWallet } from './WalletContext';

const TokenCreate = () => {
  const [name, setName] = useState('');
  const [ticker, setTicker] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const { account, signer, handleConnectWallet } = useWallet();
  const navigate = useNavigate();



  const paymentProcessorAddress = "0x60c4174047D4e48BDBa9BE2C44397149C22AeD62";
  const usdtTokenAddress = "0x6A2dEb1e986280e33d4f4246183b235cB20bde0d";



  const handleCreate = async () => {
    if (!account) {
      alert('Please connect your wallet first.');
      return;
    }
    if (!name || !ticker || !description || !imageUrl) {
      alert('All fields are required');
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      console.log(signer);
      const usdtTokenContract = new ethers.Contract(usdtTokenAddress, usdeAbi[0].abi, signer);
      const platformFee = ethers.parseUnits("25", 6); // 24 USDe with 6 decimals
      const tx = await usdtTokenContract.approve(paymentProcessorAddress, platformFee);
      await tx.wait();
      console.log('USDe approval transaction confirmed');
      const paymentProcessorContract = new ethers.Contract(paymentProcessorAddress, abi, signer);
      const transaction = await paymentProcessorContract.createMemeToken(name, ticker, imageUrl, description);
      await transaction.wait();
      console.log('Token minting transaction confirmed');
      navigate('/');
    } catch (error) {
      console.error('Error during token transfer:', error);
    }
  }






  return (
    <div className="app">
      <Navbar connectWallet={handleConnectWallet} account={account} /> {/* Pass account state */}
      <div className="token-create-container">
        <h3 className="start-new-coin" onClick={() => navigate('/')}>[go back]</h3>
        <p className="info-text">MemeCoin creation fee: 25 USDe</p>
        <p className="info-text">Max supply: 1 million tokens. Initial mint: 200k tokens.</p>
        <p className="info-text">If funding target of 72,000 USDe is met, a liquidity pool will be created on Uniswap.</p>
        <div className="input-container">
          <input
            type="text"
            placeholder="Token Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Ticker Symbol"
            value={ticker}
            onChange={(e) => setTicker(e.target.value)}
            className="input-field"
          />
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="input-field"
          />
          <input
            type="text"
            placeholder="Image URL"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="input-field"
          />
          <button className="create-button" onClick={handleCreate}>Create MemeToken</button>
        </div>
      </div>
    </div>
  );
};

export default TokenCreate;