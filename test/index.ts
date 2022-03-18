import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const ZERO_ADDRESS = ethers.constants.AddressZero;

const convertToBigNumber = (tokensAmount: number): BigNumber =>
  BigNumber.from((tokensAmount * 10 ** 18).toString());

const initialSupply = convertToBigNumber(111);

describe("MNLToken", function () {
  let token: Contract,
    owner: SignerWithAddress,
    delegate: SignerWithAddress,
    account1: SignerWithAddress;

  let clean: any; // snapshot

  before(async () => {
    [owner, delegate, account1] = await ethers.getSigners();

    const tokenContractFactory = await ethers.getContractFactory("MNLToken");
    token = await tokenContractFactory.deploy(initialSupply);
    await token.deployed();

    clean = await network.provider.request({ method: "evm_snapshot", params: [] });
    // clean = await network.provider.send("evm_snapshot");
  });

  afterEach(async () => {
    await network.provider.request({ method: "evm_revert", params: [clean] });
    // await network.provider.send("evm_snapshot", [clean]);
    // clean = await network.provider.send("evm_snapshot");
  });

  it("Should return token name", async function () {
    expect(await token.name()).to.equal("Manul Token");
  });

  it("Should return token symbol", async function () {
    expect(await token.symbol()).to.equal("MNT");
  });

  it("Should return token decimals", async function () {
    expect(await token.decimals()).to.equal(18);
  });

  it("Should return token total supply", async function () {
    expect(await token.totalSupply()).to.equal(initialSupply);
  });

  it("Should return token current balance of given account", async function () {
    expect(await token.balanceOf(owner.address)).to.equal(initialSupply);
  });

  it("Should transfer specified tokens amount from the caller's account to the specified address", async function () {
    const recipient = account1.address;

    await expect(token.transfer(ZERO_ADDRESS, 123)).to.be.revertedWith("Not valid address");
    await expect(token.transfer(recipient, convertToBigNumber(222))).to.be.revertedWith("Not enough tokens");

    await expect(token.transfer(recipient, convertToBigNumber(20)))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, recipient, convertToBigNumber(20));

    expect(await token.balanceOf(owner.address)).to.equal(convertToBigNumber(91));
    expect(await token.balanceOf(recipient)).to.equal(convertToBigNumber(20));
  });

  it("Should set allowed amount for delegate to withdraw over the caller's tokens", async function () {
    await expect(token.approve(ZERO_ADDRESS, 123)).to.be.revertedWith("Not valid address");

    const ownerAddress = owner.address;
    const delegateAddress = delegate.address;

    await expect(token.approve(delegateAddress, convertToBigNumber(60)))
      .to.emit(token, "Approval")
      .withArgs(ownerAddress, delegateAddress, convertToBigNumber(60));

    expect(await token.balanceOf(ownerAddress)).to.equal(convertToBigNumber(91));
    expect(await token.allowance(ownerAddress, delegateAddress)).to.equal(convertToBigNumber(60));
  });

  it("Should transfer specified tokens amount from the specified account to the specified account", async function () {
    const ownerAddress = owner.address;
    const recipient = account1.address;

    await expect(token.connect(delegate).transferFrom(ZERO_ADDRESS, recipient, 123)).to.be.revertedWith("Not valid address");
    await expect(token.connect(delegate).transferFrom(ownerAddress, ZERO_ADDRESS, 123)).to.be.revertedWith("Not valid address");
    await expect(token.connect(delegate).transferFrom(ownerAddress, recipient, convertToBigNumber(222)))
      .to.be.revertedWith("Not enough tokens");
    await expect(token.connect(delegate).transferFrom(ownerAddress, recipient, convertToBigNumber(65)))
      .to.be.revertedWith("Not enough tokens");

    await expect(token.connect(delegate).transferFrom(ownerAddress, recipient, convertToBigNumber(30)))
      .to.emit(token, "Transfer")
      .withArgs(ownerAddress, recipient, convertToBigNumber(30));

    expect(await token.balanceOf(recipient)).to.equal(convertToBigNumber(50));
    expect(await token.balanceOf(ownerAddress)).to.equal(convertToBigNumber(61));
    expect(await token.allowance(ownerAddress, delegate.address)).to.equal(convertToBigNumber(30));

  });

  it("Should return the amount which delegate is allowed to withdraw on behalf of owner", async function () {
    await token.approve(delegate.address, convertToBigNumber(65));
    expect(await token.allowance(owner.address, delegate.address)).to.equal(convertToBigNumber(65));
  });

  it("Should issue specified amount of tokens on the specified account, increasing the total supply", async function () {
    const ownerAddress = owner.address;

    const role = ethers.utils.id("MINTER_ROLE");
    await token.grantRole(role, ownerAddress);

    await expect(token.mint(ZERO_ADDRESS, 123)).to.be.revertedWith("Not valid address");

    await expect(token.mint(ownerAddress, convertToBigNumber(22)))
      .to.emit(token, "Transfer")
      .withArgs(ZERO_ADDRESS, ownerAddress, convertToBigNumber(22));

    expect(await token.balanceOf(ownerAddress)).to.equal(convertToBigNumber(83));
    expect(await token.totalSupply()).to.equal(convertToBigNumber(133));
  });

  it("Should destroy specified amount of tokens from the specified account`, reducing the total supply", async function () {
    const ownerAddress = owner.address;

    const role = ethers.utils.id("BURNER_ROLE");
    await token.grantRole(role, ownerAddress);

    await expect(token.burn(ZERO_ADDRESS, 123)).to.be.revertedWith("Not valid address");
    await expect(token.burn(ownerAddress, convertToBigNumber(222))).to.be.revertedWith("Not enough tokens on balance to burn");

    await expect(token.burn(ownerAddress, convertToBigNumber(23)))
      .to.emit(token, "Transfer")
      .withArgs(ownerAddress, ZERO_ADDRESS, convertToBigNumber(23));

    expect(await token.balanceOf(ownerAddress)).to.equal(convertToBigNumber(60));
    expect(await token.totalSupply()).to.equal(convertToBigNumber(110));
  });

});
