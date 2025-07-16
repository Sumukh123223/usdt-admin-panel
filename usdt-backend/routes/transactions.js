
const express = require("express");
const router = express.Router();
const Transaction = require("../models/Transaction");

router.post("/recordTransaction", async (req, res) => {
  try {
    const txn = new Transaction(req.body);
    await txn.save();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to save" });
  }
});

router.get("/all", async (req, res) => {
  const txns = await Transaction.find().sort({ timestamp: -1 });
  res.json(txns);
});

module.exports = router;
