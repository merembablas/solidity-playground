const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Gokil Heroes Collection", function () {

  let nft;
  let owner;
  let addr1;
  let addr2;
  let addr3;
  let addr4;
  let addrs;
  let publicPrice = "1.5";
  let wlPrice = "0.5";

  beforeEach(async function () {
    const GokilHeroes = await ethers.getContractFactory("GokilHeroesCollection");
    [ owner, addr1, addr2, addr3, addr4, ...addrs ] = await ethers.getSigners();

    nft = await GokilHeroes.deploy();
    await nft.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function() {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should return correct balance from contract owner", async function () {
      expect(await nft.balanceOf(owner.address)).to.equal(0);
    });

  });

  describe("Minting Assets", function () {
    it("Should mint with public price", async function() {
      await expect(
        nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
          value: ethers.utils.parseEther(wlPrice)
        })
      ).to.be.revertedWith("Public Price sent is not correct");
      
      await nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
        value: ethers.utils.parseEther(publicPrice)
      });

      await nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
        value: ethers.utils.parseEther(publicPrice)
      });

      expect(await nft.balanceOf(addr1.address)).to.equal(2);
      expect(await nft.provider.getBalance(nft.address)).to.equal(ethers.utils.parseEther("3"));

    });

    it("Should mint with whitelist price", async function() {
      await expect(
        nft.connect(addr1).addWhitelist([addr1.address, addr2.address])
      ).to.be.revertedWith(`AccessControl: account ${addr1.address.toLowerCase()} is missing role 0x0000000000000000000000000000000000000000000000000000000000000000`);

      await nft.addWhitelist([addr1.address, addr2.address]);
      
      await nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
        value: ethers.utils.parseEther(wlPrice)
      });

      await nft.connect(addr2).safeMint(addr2.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
        value: ethers.utils.parseEther(wlPrice)
      });

      expect(await nft.balanceOf(addr1.address)).to.equal(1);
      expect(await nft.balanceOf(addr2.address)).to.equal(1);
      expect(await nft.provider.getBalance(nft.address)).to.equal(ethers.utils.parseEther("1"));

    });
  });

  describe("Pause activities", function () {
    it("Should not minting when paused", async function () {
      await nft.pause();
      expect(await nft.paused()).to.equal(true);

      await expect(
        nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
          value: ethers.utils.parseEther(publicPrice)
        })
      ).to.be.reverted;

      await nft.unpause();
      expect(await nft.paused()).to.equal(false);

      expect(
        await nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
          value: ethers.utils.parseEther(publicPrice)
        })
      ).to.emit(nft, 'Transfer');
    
    });

    it("Should only contract owner can pause/unpause", async function () {
      expect(await nft.paused()).to.equal(false);

      await expect(
        nft.connect(addr1).pause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
        
      expect(await nft.paused()).to.equal(false);

      await nft.pause();
      expect(await nft.paused()).to.equal(true);

      await expect(
        nft.connect(addr1).unpause()
      ).to.be.revertedWith("Ownable: caller is not the owner");
        
      expect(await nft.paused()).to.equal(true);

    });

  });

  describe("Withdraw activities", function () {
    it("Should only owner can add team and call withdraw", async function () {
      await expect(
        nft.connect(addr1).addTeam(addr2.address)
      ).to.be.reverted;
    
      await expect(
        nft.addTeam(addr1.address)
      ).to.emit(nft, "NewTeam").withArgs(addr1.address);
  
      await expect(
        nft.connect(addr1).withdrawAll()
      ).to.be.reverted;
    
    });

    it("Should sent payment to teams", async function () {
      await expect(
        nft.withdrawAll()
      ).to.be.revertedWith("No balance");

      await nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
        value: ethers.utils.parseEther(publicPrice)
      });

      await nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
        value: ethers.utils.parseEther(publicPrice)
      });

      await expect(
        nft.withdrawAll()
      ).to.be.revertedWith("No teams");
        
      await expect(
        nft.addTeam(addr3.address)
      ).to.emit(nft, "NewTeam").withArgs(addr3.address);

      await expect(
        nft.addTeam(addr4.address)
      ).to.emit(nft, "NewTeam").withArgs(addr4.address);
      
      let balanceAddr3 = await nft.provider.getBalance(addr3.address);
      let balanceAddr4 = await nft.provider.getBalance(addr4.address);

      await nft.withdrawAll();

      expect(await nft.provider.getBalance(addr3.address)).to.equal(balanceAddr3.add(ethers.utils.parseEther("1.5")));
      expect(await nft.provider.getBalance(addr4.address)).to.equal(balanceAddr4.add(ethers.utils.parseEther("1.5")))

    });

  });

  describe("Assets metadata", function () {
    it("Should return correct token URI", async function () {
      await nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
        value: ethers.utils.parseEther(publicPrice)
      });

      await nft.connect(addr1).safeMint(addr1.address, 'QmfD856pV6KtTY49C6LBMpDPAhbggruQTigmBUS62pAZmU', {
        value: ethers.utils.parseEther(publicPrice)
      });

      let firstToken = await nft.tokenOfOwnerByIndex(addr1.address, 0);
      let secondToken = await nft.tokenOfOwnerByIndex(addr1.address, 1);
      
      expect(await nft.tokenURI(firstToken)).to.equal('ipfs://QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1');
      expect(await nft.tokenURI(secondToken)).to.equal('ipfs://QmfD856pV6KtTY49C6LBMpDPAhbggruQTigmBUS62pAZmU');
    
    });

  });

  describe("Burn assets", function () {
    it("Should burn asset", async function () {
      await nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
        value: ethers.utils.parseEther(publicPrice)
      });

      let addr1Assets = await nft.balanceOf(addr1.address);
      expect(addr1Assets).to.equal(1);

      let firstToken = await nft.tokenOfOwnerByIndex(addr1.address, 0);
      await nft.connect(addr1).burn(firstToken);

      expect(await nft.balanceOf(addr1.address)).to.equal(0);
    });

    it("Should asset owner only that can burn asset", async function () {
      await nft.connect(addr1).safeMint(addr1.address, 'QmQD5hUw84Jok4UmVWbPxPReB859XB9eCkyatCD9KHdkF1', {
        value: ethers.utils.parseEther(publicPrice)
      });
      
      let firstToken = await nft.tokenOfOwnerByIndex(addr1.address, 0);

      await expect(
        nft.burn(firstToken)
      ).to.be.revertedWith("ERC721Burnable: caller is not owner nor approved");

    });

  });

});