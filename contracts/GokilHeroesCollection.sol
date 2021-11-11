//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract GokilHeroesCollection is ERC721URIStorage, ERC721Enumerable, ERC721Burnable, AccessControl, Ownable, Pausable {
  using Counters for Counters.Counter;

  Counters.Counter private _tokenIdCounter;

  bytes32 public constant WHITELIST_ROLE = keccak256("WHITELIST_ROLE");
  uint256 public constant WHITELIST_PRICE = 0.5 ether;
  uint256 public constant PUBLIC_PRICE = 1.5 ether;
  uint256 public constant MAX_ASSETS = 10000;
  address[] public teams;

  event NewTeam(address indexed teams);

  constructor() ERC721("Gokil Heroes", "GOKIL") {
    _setupRole(WHITELIST_ROLE, _msgSender());
    _setupRole(DEFAULT_ADMIN_ROLE, _msgSender());
  }

  function safeMint(address to, string memory uri) public payable {

    uint256 supply = totalSupply();
    require( supply + 1 <= MAX_ASSETS, "Exceeds maximum NFT supply");

    if (hasRole(WHITELIST_ROLE, _msgSender())) {
      require(msg.value >= WHITELIST_PRICE, "Whitelist Price sent is not correct");
    } else {
      require(msg.value >= PUBLIC_PRICE, "Public Price sent is not correct");
    }

    uint256 tokenId = _tokenIdCounter.current();
    _tokenIdCounter.increment();
    _safeMint(to, tokenId);
    _setTokenURI(tokenId, uri);
  }

  function _baseURI() internal override virtual view returns (string memory) {
    return "ipfs://";
  }

  function withdrawAll() public onlyOwner {
    require(address(this).balance > 0, "No balance");
    require(teams.length > 0, "No teams");

    uint256 _each = address(this).balance / teams.length;

    for (uint i = 0; i < teams.length; i++) {
      (bool sent,) = payable(teams[i]).call{value: _each}("");
      require(sent, "Failed to send Ether");
    }
  }

  function addTeam(address account) public onlyOwner {
    require(account != address(0), "Cannot zero address");
    teams.push(account);

    emit NewTeam(account);
  }

  function addWhitelist(address[] memory accounts) public onlyRole(getRoleAdmin(WHITELIST_ROLE)) {
    for (uint i = 0; i < accounts.length; i++) {
      grantRole(WHITELIST_ROLE, accounts[i]);
    }
  }

  function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(AccessControl, ERC721, ERC721Enumerable)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

  function _beforeTokenTransfer(address from, address to, uint256 tokenId)
        internal
        whenNotPaused
        override(ERC721, ERC721Enumerable)
    {
        super._beforeTokenTransfer(from, to, tokenId);
    }

  function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
    super._burn(tokenId);
  }

}