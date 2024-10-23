const { expect } = require('chai');
const { ethers } = require('hardhat');

// Helper function to convert tokens to ethers (in wei)
const tokens = (n) => {
    return ethers.parseUnits(n.toString(), 'ether');
}

describe('Escrow', () => {
    let buyer, seller, inspector, lender;
    let realEstate, escrow;

    beforeEach(async () => {
        [buyer, seller, inspector, lender] = await ethers.getSigners();

        // Deploy Real Estate contract
        const RealEstate = await ethers.getContractFactory('RealEstate');
        realEstate = await RealEstate.deploy();
        await realEstate.waitForDeployment();
        console.log("RealEstate deployed to:", realEstate.target);

        // Mint NFT for seller
        let transaction = await realEstate.connect(seller).mint("https://ipfs.io/ipfs/QmTudSYeM7mz3PkYEWXWqPjomRPHogcMFSq7XAvsvsgAPS");
        await transaction.wait();
        console.log("Mint transaction:", transaction);

        // Deploy Escrow contract
        const Escrow = await ethers.getContractFactory('Escrow');
        escrow = await Escrow.deploy(
            realEstate.target,
            seller.address,
            inspector.address,
            lender.address
        );
        await escrow.waitForDeployment();
        console.log("Escrow deployed to:", escrow.target);

        // Approve the Escrow contract to transfer the seller's NFT
        transaction = await realEstate.connect(seller).approve(escrow.target, 1);
        await transaction.wait();
        console.log("Approval transaction:", transaction);

        // List the property on the Escrow contract
        transaction = await escrow.connect(seller).list(1, buyer.address, tokens(10), tokens(5));
        await transaction.wait();
        console.log("Listing transaction:", transaction.hash);
    });

    // Deployment Tests
    describe('Deployment', () => {
        it('Returns NFT address', async () => {
            const result = await escrow.nftAddress();
            expect(result).to.be.equal(realEstate.target);
        });

        it('Returns seller', async () => {
            const result = await escrow.seller();
            expect(result).to.be.equal(seller.address);
        });

        it('Returns inspector', async () => {
            const result = await escrow.inspector();
            expect(result).to.be.equal(inspector.address);
        });

        it('Returns lender', async () => {
            const result = await escrow.lender();
            expect(result).to.be.equal(lender.address);
        });
    });

    // Listing Tests
    describe('Listing', () => {
        it('Updates as listed', async () => {
            const result = await escrow.isListed(1);
            expect(result).to.be.equal(true);
        });

        it('Returns buyer', async () => {
            const result = await escrow.buyer(1);
            expect(result).to.be.equal(buyer.address);
        });

        it('Returns purchase price', async () => {
            const result = await escrow.purchasePrice(1);
            expect(result).to.be.equal(tokens(10));
        });

        it('Returns escrow amount', async () => {
            const result = await escrow.escrowAmount(1);
            expect(result).to.be.equal(tokens(5));
        });

        it('Updates ownership after listing', async () => {
            const owner = await realEstate.ownerOf(1);
            expect(owner).to.be.equal(escrow.target);
        });
    });

    // Deposit Tests
    describe('Deposits', () => {
        beforeEach(async () => {
            const transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
            await transaction.wait();
        });

        it('Updates contract balance', async () => {
            const result = await escrow.getBalance();
            expect(result).to.be.equal(tokens(5));
        });
    });

    // Inspection Tests
    describe('Inspection', () => {
        beforeEach(async () => {
            const transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait();
        });

        it('Updates inspection status', async () => {
            const result = await escrow.inspectionPassed(1);
            expect(result).to.be.equal(true);
        });
    });

    // Approval Tests
    describe('Approval', () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait();
        });

        it('Updates approval status for all parties', async () => {
            expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
            expect(await escrow.approval(1, seller.address)).to.be.equal(true);
            expect(await escrow.approval(1, lender.address)).to.be.equal(true);
        });
    });

    // Final Sale Tests
    describe('Sale', () => {
        beforeEach(async () => {
            let transaction = await escrow.connect(buyer).depositEarnest(1, { value: tokens(5) });
            await transaction.wait();

            transaction = await escrow.connect(inspector).updateInspectionStatus(1, true);
            await transaction.wait();

            transaction = await escrow.connect(buyer).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(seller).approveSale(1);
            await transaction.wait();

            transaction = await escrow.connect(lender).approveSale(1);
            await transaction.wait();

            await lender.sendTransaction({ to: escrow.target, value: tokens(5) });

            transaction = await escrow.connect(seller).finalizeSale(1);
            await transaction.wait();
        });

        it('Updates ownership after the sale', async () => {
            const owner = await realEstate.ownerOf(1);
            expect(owner).to.be.equal(buyer.address);
        });

        it('Updates contract balance to 0 after the sale', async () => {
            expect(await escrow.getBalance()).to.be.equal(0);
        });
    });
});
