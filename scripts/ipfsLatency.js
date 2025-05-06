// scripts/ipfsLatency.js
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { PinataClient } = require("@pinata/sdk");

// Create a client instance via the static .create() factory
const pinata = PinataClient.create({
  apiKey: process.env.PINATA_API_KEY,
  secretApiKey: process.env.PINATA_API_SECRET,
});

async function benchUpload(filePath, runs = 20) {
  if (!fs.existsSync(filePath)) {
    console.error(`Test file not found: ${filePath}`);
    process.exit(1);
  }
  console.log(`Benchmarking IPFS upload for ${path.basename(filePath)} over ${runs} runs...\n`);

  const latencies = [];
  for (let i = 0; i < runs; i++) {
    const stream = fs.createReadStream(filePath);
    const start = Date.now();
    try {
      await pinata.pinFileToIPFS(stream, {
        pinataMetadata: { name: `bench-upload-${i + 1}` },
        pinataOptions: { cidVersion: 1 },
      });
      const elapsed = Date.now() - start;
      console.log(`Run ${i + 1}: ${elapsed} ms`);
      latencies.push(elapsed);
    } catch (err) {
      console.error(`Run ${i + 1} failed:`, err.message);
    }
  }

  const successful = latencies.length;
  const avg = latencies.reduce((a, b) => a + b, 0) / successful;
  const variance = latencies.reduce((sum, t) => sum + (t - avg) ** 2, 0) / successful;
  const stdDev = Math.sqrt(variance);

  console.log(`\n=== Results ===`);
  console.log(`Successful: ${successful}/${runs}`);
  console.log(`Average  : ${avg.toFixed(2)} ms`);
  console.log(`Std Dev  : ${stdDev.toFixed(2)} ms`);
}

(async () => {
  // Point this at any test file you have in scripts/
  const testFile = path.join(__dirname, "test.jpg");
  await benchUpload(testFile, 20);
})();
