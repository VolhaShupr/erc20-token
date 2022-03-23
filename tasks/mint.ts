import { task } from "hardhat/config";

task("mint", "Issues tokens")
  .addParam("contractaddr", "The contract address")
  .addParam("amount", "The amount of tokens to transfer")
  .addOptionalParam("recipientaddr", "The recipient address")
  .setAction(async ({ contractaddr: contractAddress, amount, recipientaddr: recipientAddress }, hre) => {
    const [signer] = await hre.ethers.getSigners();
    const accountAddress = recipientAddress || signer.address;

    const token = await hre.ethers.getContractAt("MNLToken", contractAddress);

    // const role = hre.ethers.utils.id("MINTER_ROLE");
    // await token.grantRole(role, signer.address);

    const decimals = await token.decimals();
    const symbol = await token.symbol();
    const value = hre.ethers.utils.parseUnits(amount, decimals);

    await token.mint(accountAddress, value);

    console.log(`Minted ${amount} ${symbol} to address ${accountAddress}`);
  });
