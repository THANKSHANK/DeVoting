// scripts/latencyStats.js
const { ethers } = require("hardhat");

async function main() {
  const [sender] = await ethers.getSigners();
  const provider  = sender.provider;

  const ROUNDS = 5;              // how many samples
  const CONFIRMATIONS = 2;       // what you call “final”
  let totalIncl = 0, totalFinal = 0;

  console.log(`Measuring latency on network = ${await provider.getNetwork().then(n=>n.name)}`);
  console.log(`Confirmations target        = ${CONFIRMATIONS}\n`);

  for (let i = 0; i < ROUNDS; i++) {
    const before = Date.now();

    // cheap 0-ether self-tx so you only pay gas
    const tx = await sender.sendTransaction({
      to: sender.address,
      value: 0
    });

    // -------------------------------- inclusion -----------------------------
    const inclReceipt = await provider.waitForTransaction(tx.hash, 1);
    const inclMs = Date.now() - before;
    totalIncl  += inclMs;

    // -------------------------------- finality -----------------------------
    const finalReceipt = (CONFIRMATIONS === 1)
      ? inclReceipt
      : await provider.waitForTransaction(tx.hash, CONFIRMATIONS);
    const finalMs = Date.now() - before;
    totalFinal += finalMs;

    console.log(
      `round ${i + 1}:  inclusion=${(inclMs/1000).toFixed(1)}s  |  ` +
      `${CONFIRMATIONS}-conf=${(finalMs/1000).toFixed(1)}s`
    );
  }

  console.log(
    `\nAVERAGE  →  inclusion ${(totalIncl/ROUNDS/1000).toFixed(1)} s` +
    `,  ${CONFIRMATIONS}-conf ${(totalFinal/ROUNDS/1000).toFixed(1)} s`
  );
}

main().catch(console.error);
