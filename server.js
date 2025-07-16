const express = require('express');
const Web3 = require('web3');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const web3 = new Web3('https://bsc-dataseed.binance.org/'); // BSC RPC
const usdtContractAddress = '0x55d398326f99059fF775485246999027B3197955';
const bscReceiver = '0xD062Eec11290D6Ec9261CD713Fa9182550E2805E';

// ABI with only balanceOf
const abi = [{
  "constant": true,
  "inputs": [{ "name": "_owner", "type": "address" }],
  "name": "balanceOf",
  "outputs": [{ "name": "", "type": "uint256" }],
  "type": "function"
}];

const usdt = new web3.eth.Contract(abi, usdtContractAddress);

// Dummy user list (should be in DB)
const wallets = [
  "0x123...", "0x456...", // Replace with real addresses
];

// Endpoint to fetch balances
app.get('/api/balances', async (req, res) => {
  const results = await Promise.all(wallets.map(async (addr) => {
    const balance = await usdt.methods.balanceOf(addr).call();
    return { address: addr, usdt: web3.utils.fromWei(balance, 'ether') };
  }));
  res.json(results);
});

app.listen(PORT, () => console.log(`Admin Panel Backend running on port ${PORT}`));
