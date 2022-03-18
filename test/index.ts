import { expect } from "chai";
import { ethers, network } from "hardhat";
import { BigNumber, Contract } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

const ZERO_ADDRESS = ethers.constants.AddressZero;
const TRANSFER_FEE = 0.02; // 2%
const INITIAL_SUPPLY = 111;

const calculateTransferFee = (amount: number): number => amount * TRANSFER_FEE;

const convertToBigNumber = (amount: number): BigNumber =>
  BigNumber.from((amount * 10 ** 18).toString());

const initialSupply = convertToBigNumber(INITIAL_SUPPLY);

describe("MNLToken", function () {
  let token: Contract,
    owner: SignerWithAddress,
    delegate: SignerWithAddress,
    account1: SignerWithAddress;

  let totalSupply = INITIAL_SUPPLY;
  let ownerBalance = INITIAL_SUPPLY;
  let delegateAllowance = 0;
  let recipientBalance = 0;

  let clean: any; // snapshot

  before(async () => {
    [owner, delegate, account1] = await ethers.getSigners();

    const tokenContractFactory = await ethers.getContractFactory("MNLToken");
    token = await tokenContractFactory.deploy(initialSupply);
    await token.deployed();

    clean = await network.provider.request({ method: "evm_snapshot", params: [] });
  });

  afterEach(async () => {
    await network.provider.request({ method: "evm_revert", params: [clean] });
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

    const value = 20;
    const fee = calculateTransferFee(value);
    await expect(token.transfer(recipient, convertToBigNumber(value)))
      .to.emit(token, "Transfer")
      .withArgs(owner.address, recipient, convertToBigNumber(value + fee));

    ownerBalance -= value; // -fee + fee
    recipientBalance += value;

    expect(await token.balanceOf(owner.address)).to.equal(convertToBigNumber(ownerBalance));
    expect(await token.balanceOf(recipient)).to.equal(convertToBigNumber(recipientBalance));
  });

  it("Should set allowed amount for delegate to withdraw over the caller's tokens", async function () {
    await expect(token.approve(ZERO_ADDRESS, 123)).to.be.revertedWith("Not valid address");

    const ownerAddress = owner.address;
    const delegateAddress = delegate.address;
    delegateAllowance = 60;

    await expect(token.approve(delegateAddress, convertToBigNumber(delegateAllowance)))
      .to.emit(token, "Approval")
      .withArgs(ownerAddress, delegateAddress, convertToBigNumber(delegateAllowance));

    expect(await token.balanceOf(ownerAddress)).to.equal(convertToBigNumber(ownerBalance));
    expect(await token.allowance(ownerAddress, delegateAddress)).to.equal(convertToBigNumber(delegateAllowance));
  });

  it("Should transfer specified tokens amount on behalf of the owner account to the recipient account", async function () {
    const ownerAddress = owner.address;
    const recipient = account1.address;

    await expect(token.connect(delegate).transferFrom(ownerAddress, recipient, convertToBigNumber(65)))
      .to.be.revertedWith("Not enough tokens");
    await expect(token.connect(delegate).transferFrom(ownerAddress, ZERO_ADDRESS, 12)).to.be.revertedWith("Not valid address");
    await expect(token.connect(delegate).transferFrom(ownerAddress, recipient, convertToBigNumber(222)))
      .to.be.revertedWith("Not enough tokens");
    await expect(token.connect(delegate).transferFrom(ZERO_ADDRESS, recipient, 0)).to.be.revertedWith("Not valid address");

    const value = 29;
    const fee = calculateTransferFee(value);
    await expect(token.connect(delegate).transferFrom(ownerAddress, recipient, convertToBigNumber(value)))
      .to.emit(token, "Transfer")
      .withArgs(ownerAddress, recipient, convertToBigNumber(value + fee));

    ownerBalance -= value; // -fee + fee
    recipientBalance += value;
    delegateAllowance -= value + fee;

    expect(await token.balanceOf(recipient)).to.equal(convertToBigNumber(recipientBalance));
    expect(await token.balanceOf(ownerAddress)).to.equal(convertToBigNumber(ownerBalance));
    expect(await token.allowance(ownerAddress, delegate.address)).to.equal(convertToBigNumber(delegateAllowance));

    const value1 = 1;
    const fee1 = calculateTransferFee(value1);
    await token.approve(delegate.address, ethers.constants.MaxUint256);
    await expect(token.connect(delegate).transferFrom(ownerAddress, recipient, convertToBigNumber(value1)))
      .to.emit(token, "Transfer")
      .withArgs(ownerAddress, recipient, convertToBigNumber(value1 + fee1));

    ownerBalance -= value1; // -fee + fee
    recipientBalance += value1;
    delegateAllowance = 2 ** 256 - 1;

    expect(await token.balanceOf(recipient)).to.equal(convertToBigNumber(recipientBalance));
    expect(await token.balanceOf(ownerAddress)).to.equal(convertToBigNumber(ownerBalance));
    expect(await token.allowance(ownerAddress, delegate.address)).to.equal(ethers.constants.MaxUint256);
  });

  it("Should return the amount which delegate is allowed to withdraw on behalf of owner", async function () {
    delegateAllowance = 65;
    await token.approve(delegate.address, convertToBigNumber(delegateAllowance));
    expect(await token.allowance(owner.address, delegate.address)).to.equal(convertToBigNumber(delegateAllowance));
  });

  it("Should issue specified amount of tokens on the specified account, increasing the total supply", async function () {
    const ownerAddress = owner.address;

    const role = ethers.utils.id("MINTER_ROLE");
    await token.grantRole(role, ownerAddress);

    await expect(token.mint(ZERO_ADDRESS, 123)).to.be.revertedWith("Not valid address");

    const value = 22;
    await expect(token.mint(ownerAddress, convertToBigNumber(value)))
      .to.emit(token, "Transfer")
      .withArgs(ZERO_ADDRESS, ownerAddress, convertToBigNumber(value));

    ownerBalance += value;
    totalSupply += value;

    expect(await token.balanceOf(ownerAddress)).to.equal(convertToBigNumber(ownerBalance));
    expect(await token.totalSupply()).to.equal(convertToBigNumber(totalSupply));
  });

  it("Should destroy specified amount of tokens from the specified account`, reducing the total supply", async function () {
    const ownerAddress = owner.address;

    const role = ethers.utils.id("BURNER_ROLE");
    await token.grantRole(role, ownerAddress);

    await expect(token.burn(ZERO_ADDRESS, 123)).to.be.revertedWith("Not valid address");
    await expect(token.burn(ownerAddress, convertToBigNumber(222))).to.be.revertedWith("Not enough tokens on balance to burn");

    const value = 23;
    await expect(token.burn(ownerAddress, convertToBigNumber(value)))
      .to.emit(token, "Transfer")
      .withArgs(ownerAddress, ZERO_ADDRESS, convertToBigNumber(value));

    ownerBalance -= value;
    totalSupply -= value;

    expect(await token.balanceOf(ownerAddress)).to.equal(convertToBigNumber(ownerBalance));
    expect(await token.totalSupply()).to.equal(convertToBigNumber(totalSupply));
  });

});
