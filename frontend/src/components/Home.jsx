import React, { useState, useEffect } from 'react';
import '../App.css';
import { useNavigate } from 'react-router-dom';
import { useWallet } from './WalletContext';
import { ethers } from 'ethers';
import { abi } from './abi';
import Navbar from './Navbar';

const App = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const { account } = useWallet();
  const navigate = useNavigate();
  const { handleConnectWallet } = useWallet();

  useEffect(() => {
    const fetchMemeTokens = async () => {
      try {
        const paymentProcessorAddress = "0x60c4174047D4e48BDBa9BE2C44397149C22AeD62";

        const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
        const contract = new ethers.Contract(paymentProcessorAddress, abi, provider);

        const memeTokens = await contract.getAllMemeTokens();

        console.log('Fetched meme tokens:', memeTokens); // Log the fetched data

        setCards(
          memeTokens.map(token => {
            let description = token.description;
            if (description.length > 100) {
              description = description.slice(0, 100) + '...';
            }
            return {
              name: token.name,
              symbol: token.symbol,
              description: description,
              tokenImageUrl: token.tokenImageUrl,
              fundingRaised: ethers.formatUnits(token.fundingRaised, 6), //e'
              tokenAddress: token.tokenAddress,
              creatorAddress: token.creatorAddress,
            };
          }
          )
        );
      } catch (error) {
        console.error('Error fetching meme tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemeTokens();
  }, []);
  const handleSearch = () => {
    console.log('Searching for:', searchTerm);
  };

  const navigateToTokenDetail = (card) => {
    navigate(`/token-detail/${card.tokenAddress}`, { state: { card } }); // Use tokenAddress for URL
  };




  return (
    <div className="app">
      <Navbar connectWallet={handleConnectWallet} account={account} />
      <div className="card-container">
        <h3 className="start-new-coin" onClick={() => navigate('/token-create')}>[start a new coin]</h3>
        <img src="https://pump.fun/_next/image?url=%2Fking-of-the-hill.png&w=256&q=75" alt="Start a new coin" className="start-new-image" />

        {cards.length > 0 && (
          <div className="card main-card" onClick={() => navigateToTokenDetail(cards[0])}>
            <div className="card-content">
              <img src={cards[0].tokenImageUrl} alt={cards[0].name} className="card-image" />
              <div className="card-text">
                <h2>Created by {cards[0].creatorAddress}</h2>
                <p>Funding Raised: {cards[0].fundingRaised} USDe</p>
                <p>{cards[0].name} (ticker: {cards[0].symbol})</p>
                <p>{cards[0].description}</p>
              </div>
            </div>
          </div>
        )}

        <div className="search-container">
          <input
            type="text"
            className="search-input"
            placeholder="search for token"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-button" onClick={handleSearch}>Search</button>
        </div>

        <h4 style={{ textAlign: "left", color: "rgb(134, 239, 172)" }}>Terminal</h4>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="card-list">
            {cards.slice(1).map((card, index) => (
              <div key={index} className="card" onClick={() => navigateToTokenDetail(card)}>
                <div className="card-content">
                  <img src={card.tokenImageUrl} alt={card.name} className="card-image" />
                  <div className="card-text">
                    <h2>Created by {card.creatorAddress}</h2>
                    <p>Funding Raised: {card.fundingRaised} USDe</p>
                    <p>{card.name} (ticker: {card.symbol})</p>
                    <p>{card.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
