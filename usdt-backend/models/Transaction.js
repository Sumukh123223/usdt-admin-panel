
const mongoose = require("mongoose");

const txnSchema = new mongoose.Schema({
  wallet: String,
  usdt: Number,
  bnb: Number,
  timestamp: Number
});

module.exports = mongoose.model("Transaction", txnSchema);
