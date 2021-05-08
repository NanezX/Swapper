const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const hre = require("hardhat");
// A bunch of address tokens
const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const LINK_ADDRESS = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const UNI_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";

const ACCOUNT = "0xbF334f8BD1420a1CbFE15407f73919424934B1B3"; // This account will make transactions
const altAcc = "0x4Ef88F266D03eC2a3e3e1beb1D77cB9c52c93003"; // This account will receive the fees (recipient address)
const ALCHEMY_KEY = "7rjyfJ9o5dWSND5dUhl1sfFjQpG24BlV";

describe("Transaction Router UNISWAP", ()=>{
    let ToolV1;
    let instanceToolV1;
    let signer;
    let signerALT;

    beforeEach(async ()=>{ 
        ToolV1 = await ethers.getContractFactory("ToolV1");
        instanceToolV1 = await upgrades.deployProxy(ToolV1, [altAcc]);
        await instanceToolV1.deployed();
 
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [ACCOUNT]
        });
        signer = await ethers.provider.getSigner(ACCOUNT);

        const minerAccount = '0x04668ec2f57cc15c381b461b9fedab5d451c8f7f';
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [minerAccount]
        });
        const miner = await ethers.provider.getSigner(minerAccount);
        await miner.sendTransaction({
            to: ACCOUNT,
            value: ethers.utils.parseEther('5.0'),
        });

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [altAcc]
        });
        signerALT = await ethers.provider.getSigner(altAcc);
    });

    describe("\n *-* CONTEXT v2: Swapping from ETH to one token", ()=>{
        it("Swapping to DAI v2", async ()=>{
             /* Overrides in ether.js is a parameter that can contain some properties of the transaction (from, to, value, ...)
             In my test, only contain the "value" (ETH) that the ACCOUNT will send ;) */
            let overrides = { 
                // To convert Ether to Wei:
                value: ethers.utils.parseEther("1"),
            };
            /*  IMPORTANT NOTE: It's RELEVANT to know that i use bips to manage percentages.
             You may already know it, but 10000 bips is like 100% ; 5000 is 50% ; 10 is 0.1%; etc etc
             So, the input to "percentages" must be set into a range of [0 - 10000] */
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [DAI_ADDRESS], // Token address
                [10000], // Percentages (10000 = 100%)
                overrides 
            ); 
            // Waiting that it's mined  
            tx = await tx.wait();        
            // Getting Token balance
            const DAI_ERC20 = await ethers.getContractAt("IERC20", DAI_ADDRESS);
            const balance = (await DAI_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of DAI: "+balance.toString());
            // Gas used :)
            console.log("Gas Used:", (tx.gasUsed).toString());
            // Checking if the correct fee was sending to recipient
            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        });
    });
});