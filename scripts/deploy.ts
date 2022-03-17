import { ethers } from "hardhat";
import { BigNumber } from "ethers";

async function main() {
  const initialSupply = BigNumber.from((111 * 10 ** 18).toString());
  const tokenContractFactory = await ethers.getContractFactory("MNLToken");
  const tokenContract = await tokenContractFactory.deploy(initialSupply);

  await tokenContract.deployed();

  console.log("MNLToken contract deployed to:", tokenContract.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
