// hardhat.config.js
require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();
// hardhat.config.js
require("dotenv").config();

module.exports = {
  solidity: "0.8.19",
  networks: {
    holesky: {
      url: process.env.HOLESKY_URL,
      accounts: [process.env.PRIVATE_KEY],   // <-- funded key here
      chainId: 17_000,
    },
  },
};

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    hardhat: {
      chainId: 1337,
    },
    holesky: {
      url: process.env.HOLESKY_URL || process.env.HOLESKY_URL_OPTIONAL,
      accounts:
        process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : [],
      chainId: 17000,
    },
  },
  paths: {
    artifacts: "./artifacts",
    sources: "./contracts",
    cache: "./cache",
    tests: "./test",
  },
};
