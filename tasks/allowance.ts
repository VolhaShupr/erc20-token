import { task } from "hardhat/config";

task("allowance", "Shows amount as the allowance of `spender` over the caller's tokens")
  .addParam("contractaddr", "The contract address")
  .addParam("owneraddr", "The owner address")
  .addParam("delegateaddr", "The delegate address")
  .setAction(async ({ contractaddr: contractAddress, owneraddr: ownerAddress, delegateaddr: delegateAddress }, hre) => {
    const token = await hre.ethers.getContractAt("MNLToken", contractAddress);
    const amount = await token.allowance(ownerAddress, delegateAddress);

    console.log(`The allowance of ${delegateAddress} over the ${ownerAddress} is ${amount}`);
  });
