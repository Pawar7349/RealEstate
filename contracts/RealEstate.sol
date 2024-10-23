// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.27;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract RealEstate is ERC721URIStorage {
    uint256 private _tokenIds;

    constructor() ERC721("RealEstate", "REAL") {}

    // Mint a new NFT representing a piece of real estate
    function mint(string memory tokenURI) public returns (uint256) {
        _tokenIds += 1;  // Increment the token ID
        uint256 newItemId = _tokenIds;
        _mint(msg.sender, newItemId);  // Mint the new token
        _setTokenURI(newItemId, tokenURI);  // Set the token URI for metadata
        return newItemId;
    }

    // Get the total number of tokens minted
    function totalSupply() public view returns (uint256) {
        return _tokenIds;  // Return the current number of tokens
    }
}
