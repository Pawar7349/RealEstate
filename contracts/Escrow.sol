// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.27;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public nftAddress;
    address payable public seller;
    address public inspector;
    address public lender;

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasePrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256 => bool) public inspectionPassed;
    mapping(uint256 => mapping(address => bool)) public approval;

    constructor(
        address _nftAddress,
        address payable _seller,
        address _inspector,
        address _lender
    ) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;
    }

    modifier onlyBuyer(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "Only the assigned buyer can call this method.");
        _;
    }

    modifier onlySeller() {
        require(msg.sender == seller, "Only the seller can call this method.");
        _;
    }

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only the inspector can call this method.");
        _;
    }

    // List an NFT for sale
    function list(
        uint256 _nftID,
        address _buyer,
        uint256 _purchasePrice,
        uint256 _escrowAmount
    ) public onlySeller {
        require(!isListed[_nftID], "NFT is already listed for sale.");
        // Transfer NFT from seller to this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);

        isListed[_nftID] = true;
        purchasePrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyer;
    }

    // Deposit earnest money by the buyer
    function depositEarnest(uint256 _nftID) public payable onlyBuyer(_nftID) {
        require(isListed[_nftID], "NFT is not listed for sale.");
        require(msg.value >= escrowAmount[_nftID], "Insufficient earnest deposit.");
    }
  event InspectionStatusUpdated(uint256 nftID, bool passed);
    // Update the inspection status
    function updateInspectionStatus(uint256 _nftID, bool _passed) public onlyInspector {
        require(isListed[_nftID], "NFT is not listed for sale.");
        inspectionPassed[_nftID] = _passed;
        emit InspectionStatusUpdated(_nftID, _passed); 
    }

    // Approve the sale (called by buyer, seller, or lender)
    function approveSale(uint256 _nftID) public {
        require(
            msg.sender == buyer[_nftID] || msg.sender == seller || msg.sender == lender,
            "Only buyer, seller, or lender can approve."
        );
        approval[_nftID][msg.sender] = true;
    }

    // Finalize the sale after all conditions are met
    function finalizeSale(uint256 _nftID) public {
        require(isListed[_nftID], "NFT is not listed for sale.");
        require(inspectionPassed[_nftID], "Inspection has not passed.");
        require(approval[_nftID][buyer[_nftID]], "Buyer has not approved the sale.");
        require(approval[_nftID][seller], "Seller has not approved the sale.");
        require(approval[_nftID][lender], "Lender has not approved the sale.");
        require(address(this).balance >= purchasePrice[_nftID], "Insufficient funds to finalize the sale.");

        isListed[_nftID] = false;

        // Transfer funds to the seller
        (bool success, ) = payable(seller).call{value: address(this).balance}("");
        require(success, "Failed to transfer funds to seller.");

        // Transfer the NFT to the buyer
        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    }

    // Cancel the sale and refund earnest money if applicable
    function cancelSale(uint256 _nftID) public {
        require(isListed[_nftID], "Sale is not active.");
        if (!inspectionPassed[_nftID]) {
            payable(buyer[_nftID]).transfer(address(this).balance);
        } else {
            payable(seller).transfer(address(this).balance);
        }
        isListed[_nftID] = false;
    }

    // Fallback function to receive ETH
    receive() external payable {}

    // Get the balance of the contract
    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }
}
