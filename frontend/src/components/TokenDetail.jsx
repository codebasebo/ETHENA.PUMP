import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import '../App.css';
import { abi } from './abi';
import { tokenAbi } from './tokenAbi';
import { usdeAbi } from './usdeAbi'; // Ensure you have the ABI for USDe
import Navbar from './Navbar';
import { useWallet } from './WalletContext';

const TokenDetail = () => {
  const { tokenAddress } = useParams();
  const location = useLocation();
  const { card } = location.state || {};
  const [account, setAccount] = useState(null);
  const [signer, setSigner] = useState(null);
  const { handleConnectWallet } = useWallet();
  const [refresh, setRefresh] = useState(false);


  const [cost, setCost] = useState('0');
  const [purchaseAmount, setPurchaseAmount] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [owners, setOwners] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalSupply, setTotalSupply] = useState('0');
  const [remainingTokens, setRemainingTokens] = useState('0');
  const navigate = useNavigate();

  const tokenDetails = card || {
    name: 'Unknown',
    symbol: 'Unknown',
    description: 'No description available',
    tokenImageUrl: 'https://via.placeholder.com/200',
    fundingRaised: '0 USDe',
    creatorAddress: '0x0000000000000000000000000000000000000000',
  };

  const fundingRaised = parseInt(tokenDetails.fundingRaised);
  const fundingGoal = 72000;
  const maxSupply = 800000;




  useEffect(() => {
    const fetchData = async () => {
      try {
        const ownersResponse = await fetch(
          `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/owners?chain=sepolia&order=DESC`,
          {
            headers: {
              accept: 'application/json',
              'X-API-Key': process.env.REACT_APP_X_API_KEY,
            },
          }
        );
        const ownersData = await ownersResponse.json();
        setOwners(ownersData.result || []);

        const transfersResponse = await fetch(
          `https://deep-index.moralis.io/api/v2.2/erc20/${tokenAddress}/transfers?chain=sepolia&order=DESC`,
          {
            headers: {
              accept: 'application/json',
              'X-API-Key': process.env.REACT_APP_X_API_KEY,
            },
          }
        );
        const transfersData = await transfersResponse.json();
        setTransfers(transfersData.result || []);

        const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
        const contract = new ethers.Contract(tokenAddress, tokenAbi, provider);
        const totalSupplyResponse = await contract.totalSupply();
        const totalSupplyFormatted = parseInt(ethers.formatUnits(totalSupplyResponse, 'ether')) - 200000;
        setTotalSupply(totalSupplyFormatted);

        setRemainingTokens(maxSupply - totalSupplyFormatted);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tokenAddress]);

  const fundingRaisedPercentage = (fundingRaised / fundingGoal) * 100;
  const totalSupplyPercentage = ((totalSupply - 200000) / (maxSupply - 200000)) * 100;

  const getCost = async () => {
    if (!purchaseAmount) return;

    try {
      const provider = new ethers.JsonRpcProvider(process.env.REACT_APP_RPC_URL);
      const contract = new ethers.Contract(process.env.REACT_APP_CONTRACT_ADDRESS, abi, provider);
      const costInWei = await contract.calculateCost(totalSupply, purchaseAmount);
      const formattedCost = ethers.formatUnits(costInWei, 6); // USDT typically has 6 decimals
      const roundedCost = parseFloat(formattedCost).toFixed(6);
      setCost(roundedCost);
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error calculating cost:', error);
    }
  };

  const handlePurchase = async () => {
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const paymentProcessorAddress = "0x60c4174047D4e48BDBa9BE2C44397149C22AeD62";
      const usdtTokenAddress = "0x6A2dEb1e986280e33d4f4246183b235cB20bde0d";

      const paymentProcessorContract = new ethers.Contract(paymentProcessorAddress, abi, signer);
      const usdtTokenContract = new ethers.Contract(usdtTokenAddress, usdeAbi[0].abi, signer);

      const costInUSDT = ethers.parseUnits(cost, 6);

      const approveTx = await usdtTokenContract.approve(paymentProcessorAddress, costInUSDT);
      await approveTx.wait();

      const transaction = await paymentProcessorContract.buyMemeToken(tokenAddress, purchaseAmount);
      const receipt = await transaction.wait();

      alert(`Transaction successful! Hash: ${receipt.transactionHash}`);
      setIsModalOpen(false);

      setRefresh(true); // Refresh the page to reflect the updated data
    } catch (error) {
      console.error('Error during purchase:', error);
    }
  };


  useEffect(() => {
    if (refresh) {

      setRefresh(false); // Reset refresh state
    }
  }, [refresh]);


  return (
    <div className="token-detail-container">
      <Navbar connectWallet={handleConnectWallet} account={account} />

      <h3 className="start-new-coin" onClick={() => navigate('/')}>[go back]</h3>

      <div className="token-details-section">
        <div className="token-details">
          <h2>Token Detail for {tokenDetails.name}</h2>
          <img src={tokenDetails.tokenImageUrl} alt={tokenDetails.name} className="token-detail-image" />
          <p><strong>Creator Address:</strong> {tokenDetails.creatorAddress}</p>
          <p><strong>Token Address:</strong> {tokenAddress}</p>
          <p><strong>Funding Raised:</strong> {tokenDetails.fundingRaised}</p>
          <p><strong>Token Symbol:</strong> {tokenDetails.symbol}</p>
          <p><strong>Description:</strong> {tokenDetails.description}</p>
        </div>

        <div className="right-column">
          <div className="progress-bars">
            <div className="progress-container">
              <p><strong>Bonding Curve Progress:</strong> {fundingRaised} / {fundingGoal} USDe</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${fundingRaisedPercentage}%` }}></div>
              </div>
              <p>When the market cap reaches {fundingGoal} USDe, all the liquidity from the bonding curve will be deposited into Uniswap, and the LP tokens will be burned. Progression increases as the price goes up.</p>
            </div>

            <div className="progress-container">
              <p><strong>Remaining Tokens Available for Sale:</strong> {remainingTokens} / 800,000</p>
              <div className="progress-bar">
                <div className="progress" style={{ width: `${totalSupplyPercentage}%` }}></div>
              </div>
            </div>
          </div>

          <div className="buy-tokens">
            <h3>Buy Tokens</h3>
            <input
              type="number"
              placeholder="Enter amount of tokens to buy"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              className="buy-input"
            />
            <button onClick={getCost} className="buy-button">Purchase</button>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="modal">
          <div className="modal-content">
            <h4>Confirm Purchase</h4>
            <p>Cost of {purchaseAmount} tokens: {cost} USDe</p>
            <button onClick={handlePurchase} className="confirm-button">Confirm</button>
            <button onClick={() => setIsModalOpen(false)} className="cancel-button">Cancel</button>
          </div>
        </div>
      )}

      <h3>Owners</h3>
      {loading ? (
        <p>Loading owners...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Owner Address</th>
              <th>Percentage of Total Supply</th>
            </tr>
          </thead>
          <tbody>
            {owners.map((owner, index) => (
              <tr key={index}>
                <td>{owner.owner_address}</td>
                <td>{owner.percentage_relative_to_total_supply}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3>Transfers</h3>
      {loading ? (
        <p>Loading transfers...</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>From Address</th>
              <th>To Address</th>
              <th>Value (USDe)</th>
              <th>Transaction Hash</th>
            </tr>
          </thead>
          <tbody>
            {transfers.map((transfer, index) => (
              <tr key={index}>
                <td>{transfer.from_address}</td>
                <td>{transfer.to_address}</td>
                <td>{transfer.value_decimal}</td>
                <td><a style={{ color: "white" }} href={`https://sepolia.etherscan.io/tx/${transfer.transaction_hash}`} target="_blank" rel="noopener noreferrer">{transfer.transaction_hash}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default TokenDetail;

