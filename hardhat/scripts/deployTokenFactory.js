const main = async () => {

    const [deployer] = await hre.ethers.getSigners();
    const accountBalance = await hre.ethers.provider.getBalance(deployer.address);


    console.log("deploying contract with account ", await deployer.getAddress());
    console.log("Account balance ", accountBalance.toString());

    const tokenFactory = await hre.ethers.getContractFactory("TokenFactory");
    const tokenContract = await tokenFactory.deploy("0xF62c03E08ada871A0bEb309762E260a7a6a880E6", "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3", "0x0e54C926Aa723d799C32196DAA4F5ae749C69A31");
    await tokenContract.waitForDeployment();
    console.log("Contract deployed to: ", await tokenContract.getAddress());





}

const runMain = async () => {
    try {
        await main();
        process.exit(0);

    } catch (error) {
        console.log(error)
        process.exit(1);
    }
}

runMain();