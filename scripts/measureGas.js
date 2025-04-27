// scripts/measureGas.js
const { ethers } = require("hardhat");

async function main() {
  // 1 Deploy a fresh contract
  const [owner, voter] = await ethers.getSigners();
  const Voting = await ethers.getContractFactory("Create");
  const voting = await Voting.deploy();
  await voting.deployed();

  // 2 Helper that executes a tx and prints gas
  async function logGas(promise, label) {
    const tx = await promise;
    const rc = await tx.wait();
    console.log(
      `${label.padEnd(15)} | gasUsed = ${rc.gasUsed.toString().padStart(7)}`
    );
    return rc.gasUsed;
  }

  /* --- Measure core functions --- */
  await logGas(
    voting
      .connect(owner)
      .setCandidate(
        voter.address,
        "30",
        "Alice",
        "ipfs://image",
        "ipfs://meta"
      ),
    "setCandidate"
  );

  await logGas(
    voting
      .connect(owner)
      .voterRight(
        voter.address,
        "Alice",
        "ipfs://avatar",
        "ipfs://meta"
      ),
    "voterRight"
  );

  await logGas(
    voting.connect(voter).vote(voter.address, 1),
    "vote"
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
