const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), 'ether');
};

async function main() {
  const [buyer, seller, inspector, lender] = await ethers.getSigners();
  let realEstate, escrow;

  try {
    // Deploy RealEstate contract
    const RealEstate = await ethers.getContractFactory('RealEstate');
    realEstate = await RealEstate.deploy();
    await realEstate.waitForDeployment();

    console.log(`RealEstate Address: ${await realEstate.getAddress()}`);

    // Mint 3 properties in parallel
    const mintPromises = [];
    for (let i = 0; i < 3; i++) {
      const mintPromise = realEstate.connect(seller).mint(`https://ipfs.io/ipfs/QmQVcpsjrA6cr1iJjZAodYwmPekYgbnXGo4DFubJiLc2EB/${i + 1}.json`);
      mintPromises.push(mintPromise);
    }
    await Promise.all(mintPromises);
    console.log("Minted 3 properties.");

  } catch (error) {
    console.error("RealEstate contract deployment or minting failed:", error);
    process.exit(1);
  }

  try {
    // Deploy Escrow contract
    const Escrow = await ethers.getContractFactory('Escrow');
    escrow = await Escrow.deploy(
      realEstate.target,
      seller.address,
      inspector.address,
      lender.address
    );

    await escrow.waitForDeployment();
    console.log(`Escrow deployed at: ${await escrow.getAddress()}`);

    // Approve and List 3 properties in parallel
    const approvePromises = [];
    for (let i = 0; i < 3; i++) {
      const approvePromise = realEstate.connect(seller).approve(escrow.target, i + 1);
      approvePromises.push(approvePromise);
    }
    await Promise.all(approvePromises);
    console.log("Properties approved for escrow.");

    // List properties with corresponding escrow amounts
    await Promise.all([
      escrow.connect(seller).list(1, buyer.address, tokens(20), tokens(10)),
      escrow.connect(seller).list(2, buyer.address, tokens(15), tokens(5)),
      escrow.connect(seller).list(3, buyer.address, tokens(10), tokens(5)),
    ]);
    console.log("Listed 3 properties.");

  } catch (error) {
    console.error("Escrow contract deployment or listing failed:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected error:", error);
  process.exit(1);
});
