async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Calling faucet with the account:", deployer.address);

    const usdtAddress = "0x0e54C926Aa723d799C32196DAA4F5ae749C69A31"; // Replace with your deployed USDT contract address
    const USDT = await ethers.getContractFactory("USDe");
    const usdt = USDT.attach(usdtAddress);

    const recipient = "0x8c05F3726aC1cA7Fd2F728B1654Ec3BC20638B8a"; // Replace with the recipient address
    const amount = ethers.parseUnits("1000000000000", 6); // Amount to mint (e.g., 1000 USDT with 6 decimals)

    const tx = await usdt.faucet(recipient, amount);
    await tx.wait();

    console.log(`Minted ${amount.toString()} USDT to ${recipient}`);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });