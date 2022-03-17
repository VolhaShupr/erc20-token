import { task } from "hardhat/config";
import { BigNumber } from "ethers";

task("approve", "Sets `amount` as the allowance of `spender` over the caller's tokens")
  .addParam("contractaddr", "The contract address")
  .addParam("delegateaddr", "The delegate address")
  .addParam("amount", "The amount of tokens to transfer")
  .setAction(async ({ contractaddr: contractAddress, delegateaddr: delegateAddress, amount }, hre) => {
    const [signer] = await hre.ethers.getSigners();

    const token = await hre.ethers.getContractAt("MNLToken", contractAddress);

    const decimals = await token.decimals();
    const symbol = await token.symbol();
    const value = BigNumber.from((amount * 10 ** decimals).toString());

    await token.approve(delegateAddress, value);

    console.log(`Set ${amount} ${symbol} as the allowance of ${delegateAddress} over the ${signer.address} tokens`);
  });
