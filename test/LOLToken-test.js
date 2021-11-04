const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LOL Token", function () {
  let token;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  let initialSupply = 1000;

  beforeEach(async function () {
    const LOLToken = await ethers.getContractFactory('LOLToken');
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    token = await LOLToken.deploy(initialSupply);
    await token.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await token.owner()).to.equal(owner.address);
    });

    it("Should return correct balance from contract owner", async function () {
      const ownerBalance = await token.balanceOf(owner.address);
      expect(await token.totalSupply()).to.equal(ownerBalance);
    });

  });

  describe("Token Supply", function () {
    it("Should return valid initial total supply", async function () {
      expect(await token.totalSupply()).to.equal(initialSupply);
    });
  
    it("Should return newest total supply", async function () {
      const additionalSupply = 2000;
      await token.mint(additionalSupply);
      expect(await token.totalSupply()).to.equal(initialSupply + additionalSupply);
    });
  
    it("Should return error exceeded its cap", async function () {
      // maximum supply 10000
      await expect(
        token.mint(30000)
      ).to.be.revertedWith("ERC20Capped: cap exceeded");
    });

    it("Should return error, only owner can mint", async function () {
      await expect(
        token.connect(addr1).mint(10)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("Transactions", function () {
    it("Should transfer token between accounts", async function () {
      const ownerBalance = await token.balanceOf(owner.address);

      await token.transfer(addr1.address, 10);
      expect(await token.balanceOf(addr1.address)).to.equal(10);

      await token.connect(addr1).transfer(addr2.address, 5);
      expect(await token.balanceOf(addr2.address)).to.equal(5);
      expect(await token.balanceOf(addr1.address)).to.equal(5);

      await token.connect(addr2).transfer(owner.address, 5);
      expect(await token.balanceOf(addr2.address)).to.equal(0);
      expect(await token.balanceOf(owner.address)).to.equal(ownerBalance - 5);

      await token.connect(addr1).transfer(owner.address, 5);
      expect(await token.balanceOf(addr1.address)).to.equal(0);
      expect(await token.balanceOf(owner.address)).to.equal(ownerBalance);

    });

    it("Should no balance no transfer transfer ya", async function () {
      const ownerBalance = await token.balanceOf(owner.address);

      await expect(
        token.connect(addr1).transfer(owner.address, 1)
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");

      expect(await token.balanceOf(owner.address)).to.equal(ownerBalance);
    });
  });

  describe("Pause Activities", function () {
    it("Should transfer when not paused", async function () {
      expect(await token.paused()).to.equal(false);

      await token.transfer(addr1.address, 10);
      expect(await token.balanceOf(addr1.address)).to.equal(10);
    
    });

    it("Should not transfer when paused", async function () {
      await token.pause();
      expect(await token.paused()).to.equal(true);

      await expect(
        token.transfer(addr1.address, 10)
      ).to.be.revertedWith("ERC20Pausable: token transfer while paused");

      await token.unpause();
      expect(await token.paused()).to.equal(false);

      await token.transfer(addr1.address, 10);
      expect(await token.balanceOf(addr1.address)).to.equal(10);
    
    });

    it("Should only contract owner can pause/unpause", async function () {
      expect(await token.paused()).to.equal(false);

      await expect(
        token.connect(addr1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
        
      expect(await token.paused()).to.equal(false);

      await token.pause();
      expect(await token.paused()).to.equal(true);

      await expect(
        token.connect(addr1).unpause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
        
      expect(await token.paused()).to.equal(true);

    });

  });

  describe("Burn Token", function () {
    it("Should burn token", async function () {
      const ownerBalance = await token.balanceOf(owner.address);

      await token.burn(10);
      expect(await token.balanceOf(owner.address)).to.equal(ownerBalance - 10);
      expect(await token.totalSupply()).to.equal(initialSupply - 10);
    });

    it("Should owner address only that can burn token", async function () {
      await expect(
        token.connect(addr1).burnFrom(owner.address, 10)
      ).to.be.revertedWith("ERC20: burn amount exceeds allowance");
      
      const ownerBalance = await token.balanceOf(owner.address);

      await token.approve(addr1.address, 10);
      await token.connect(addr1).burnFrom(owner.address, 10);
      expect(await token.balanceOf(owner.address)).to.equal(ownerBalance - 10);
      expect(await token.totalSupply()).to.equal(initialSupply - 10);
    });

  });

});
