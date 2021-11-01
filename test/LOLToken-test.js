const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LOLToken", function () {
  it("Should return total supply", async function () {
    const LOLToken = await ethers.getContractFactory("LOLToken");
    const token = await LOLToken.deploy(1000);
    await token.deployed();

    expect(await token.totalSupply()).to.equal(1000);
  });
});
