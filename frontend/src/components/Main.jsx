import { BrowserRouter, Routes, Route } from 'react-router-dom';
import React from 'react';
import Home from './Home.jsx';
import TokenDetail from './TokenDetail.jsx';
import TokenCreate from './TokenCreate.jsx';
import { WalletProvider } from './WalletContext.jsx';

const Main = () => {
  return (
    <WalletProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/token-detail/:tokenAddress" element={<TokenDetail />} />
          <Route path="/token-create" element={<TokenCreate />} />
        </Routes>
      </BrowserRouter>
    </WalletProvider>
  );
};

export default Main;