import * as dotenv from "dotenv";
import { task } from "hardhat/config";
import { BigNumber } from "ethers";

dotenv.config();

task("transferFrom", "Makes a token transfer on behalf of owner")
  .addParam("contractaddr", "The contract address")
  .addParam("delegateaddr", "The delegate address")
  .addParam("delegatekey", "The delegate private key")
  .addParam("owneraddr", "The owner address key")
  .addParam("recipientaddr", "The recipient address")
  .addParam("amount", "The amount of tokens to transfer")
  .setAction(async ({
    contractaddr: contractAddress,
    delegateaddr: delegateAddress,
    delegatekey: delegatePrivateKey,
    owneraddr: ownerAddress,
    recipientaddr: recipientAddress,
    amount,
  }, hre) => {
    const provider = new hre.ethers.providers.JsonRpcProvider(process.env.RINKEBY_API_URL);
    const delegate = new hre.ethers.Wallet(delegatePrivateKey, provider);

    const token = await hre.ethers.getContractAt("MNLToken", contractAddress);

    const decimals = await token.decimals();
    const symbol = await token.symbol();
    const value = BigNumber.from((amount * 10 ** decimals).toString());

    await token.connect(delegate).transferFrom(ownerAddress, recipientAddress, value);

    console.log(`Transferred on behalf of address ${ownerAddress} to recipient ${recipientAddress} in amount of ${amount} ${symbol}`);
  });
