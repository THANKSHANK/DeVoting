// scripts/measureGas.js
const hre = require("hardhat");

async function main() {
  const [owner, voter, candidate] = await hre.ethers.getSigners();

  // 1. Deploy the contract
  const Create = await hre.ethers.getContractFactory("Create", owner);
  const create = await Create.deploy();
  await create.deployed();
  console.log("✅ Contract deployed to:", create.address);

  // 2. Measure setCandidate(...)
  const txSet = await create.setCandidate(
    candidate.address,
    "30",                   // age
    "Alice",                // name
    "https://ipfs.io/img",  // image URI
    "ipfs://metadata"       // metadata URI
  );
  const rcSet = await txSet.wait();
  console.log(`setCandidate() gas used: ${rcSet.gasUsed.toString()}`);

  // 3. Measure voterRight(...)
  const txAuth = await create.voterRight(
    voter.address,
    "Bob",                  // name
    "https://ipfs.io/img2", // image URI
    "ipfs://voterMeta"      // metadata URI
  );
  const rcAuth = await txAuth.wait();
  console.log(`voterRight()   gas used: ${rcAuth.gasUsed.toString()}`);

  // 4. Measure vote(...)
  // extract candidateId from the event
  const candidateId = rcSet.events.find(e => e.event === "CandidateCreate")
                         .args.candidateId;
  const txVote = await create
    .connect(voter)
    .vote(candidate.address, candidateId);
  const rcVote = await txVote.wait();
  console.log(`vote()         gas used: ${rcVote.gasUsed.toString()}`);
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });