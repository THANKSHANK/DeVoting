// scripts/localLatencies.js
const { ethers } = require("hardhat");

async function main() {
  const signers = await ethers.getSigners();
  const organizer = signers[0];
  const voters    = signers.slice(1, 11);  // next 10 accounts

  // --- Deployment latency ---
  const deployStart = Date.now();
  const Factory = await ethers.getContractFactory("Create", organizer);
  const create  = await Factory.deploy();
  await create.deployed();
  console.log(`Deployment latency: ${(Date.now() - deployStart)/1000}s`);

  // --- Candidate registration (once) ---
  await (await create.setCandidate(
    organizer.address,
    "30",
    "Alice",
    "QmDummyImageCID",
    "QmDummyMetaCID"
  )).wait(1);

  // --- Whitelist + Vote latency per voter ---
  const whitelistTimes = [];
  const voteTimes      = [];

  for (let i = 0; i < voters.length; i++) {
    const v = voters[i];

    // 1) Whitelist
    const startW = Date.now();
    await (await create.voterRight(
      v.address,
      "25",
      `Voter${i+1}`,
      "QmVoterMetaCID"
    )).wait(1);
    whitelistTimes.push((Date.now() - startW)/1000);

    // 2) Vote
    const conn = create.connect(v);
    const startV = Date.now();
    await (await conn.vote(organizer.address, 1)).wait(1);
    voteTimes.push((Date.now() - startV)/1000);
  }

  // --- Report averages ---
  const avg = arr => arr.reduce((a,b)=>a+b,0)/arr.length;
  console.log(`\nWhitelist avg latency: ${avg(whitelistTimes).toFixed(3)}s`);
  console.log(`Vote      avg latency: ${avg(voteTimes).toFixed(3)}s`);

  // --- Dump all samples ---
  console.log("\nDetail (s):");
  console.log("Whitelist:", whitelistTimes.map(t=>t.toFixed(3)).join(", "));
  console.log("Vote      :", voteTimes.map(t=>t.toFixed(3)).join(", "));
}

main()
  .then(()=>process.exit(0))
  .catch(e=>{
    console.error(e);
    process.exit(1);
  });
