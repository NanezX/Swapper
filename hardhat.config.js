require("@nomiclabs/hardhat-waffle");
require('@nomiclabs/hardhat-ethers');
require('@openzeppelin/hardhat-upgrades');
require("hardhat-gas-reporter");

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});
const ALCHEMY_KEY = "7rjyfJ9o5dWSND5dUhl1sfFjQpG24BlV";
module.exports = {
  networks: {
    hardhat: {
      forking: {
        url: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
        blockNumber: 12391206
        // If you wanna change the block, please make sure that you change this number in restartFork function into "ToolV1.test.js"
        // for a correct test when the "forking mainnet" will reset. (line 462)
      }
    }
  },
  solidity: {
    version: "0.8.4",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  mocha: {
    timeout: 240000,
  },
};

