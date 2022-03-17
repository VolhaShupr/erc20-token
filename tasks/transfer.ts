import { task } from "hardhat/config";
import { BigNumber } from "ethers";

task("transfer", "Makes a token transfer")
  .addParam("contractaddr", "The contract address")
  .addParam("recipientaddr", "The recipient address")
  .addParam("amount", "The amount of tokens to transfer")
  .setAction(async ({ contractaddr: contractAddress, recipientaddr: recipientAddress, amount }, hre) => {
    const [signer] = await hre.ethers.getSigners();

    const token = await hre.ethers.getContractAt("MNLToken", contractAddress);

    const decimals = await token.decimals();
    const symbol = await token.symbol();
    const value = BigNumber.from((amount * 10 ** decimals).toString());

    await token.transfer(recipientAddress, value);

    console.log(`Transferred from address ${signer.address} to recipient ${recipientAddress} in amount of ${amount} ${symbol}`);
  });
