const { expect } = require("chai");
const { ethers} = require("hardhat");
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
        /* Restarting the forking network at each test to a better calculate of tokens amounts obtained. This will
        REALLY SLOOW DOWN the test :( (and I wrote several tests), but it can be checking specifily the amount of tokens 
        obtained (that will be printed) with some prices in exchanges ETH/Token */
        await hre.network.provider.request({
            method: "hardhat_reset",
            params: [{
                forking: {
                jsonRpcUrl: `https://eth-mainnet.alchemyapi.io/v2/${ALCHEMY_KEY}`,
                blockNumber: 12391206
                }
            }]
        });
        
        // 1. Deploying and setting proxy
        ToolV1 = await ethers.getContractFactory("ToolV1");
        instanceToolV1 = await upgrades.deployProxy(ToolV1, [altAcc]);
        await instanceToolV1.deployed();

        // 2. Impersonating my Account
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [ACCOUNT]
        });
        // 3. Setting it as signer
        signer = await ethers.provider.getSigner(ACCOUNT);

        // 4. Getting some eth from a miner (because im poor)
        // - Now, Impersonate the miner Account 
        const minerAccount = '0x04668ec2f57cc15c381b461b9fedab5d451c8f7f';
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [minerAccount]
        });
        // - Setting it as signer
        const miner = await ethers.provider.getSigner(minerAccount);
        // - AND send ether to my ACCOUNT (:D)
        await miner.sendTransaction({
            to: ACCOUNT,
            value: ethers.utils.parseEther('5.0'),
        });

        // 5. Impersonating my Alt Account (recipient account)
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [altAcc]
        });
        // - Setting it as signer
        signerALT = await ethers.provider.getSigner(altAcc);
    });

    describe("\n *-* CONTEXT: Swapping from ETH to one token", ()=>{
        it("Swapping to DAI", async ()=>{
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
        // ------------------------------------------------------------------------
        it("Swapping to USDT", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            };
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [USDT_ADDRESS],
                [10000],
                overrides
            ); 
            tx = await tx.wait();       
            const USDT_ERC20 = await ethers.getContractAt("IERC20", USDT_ADDRESS);
            const balance = (await USDT_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of USDT: "+balance.toString());

            console.log("Gas Used:", (tx.gasUsed).toString());

            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        });
        // ------------------------------------------------------------------------
        it("Swapping to LINK", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            };
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [LINK_ADDRESS],
                [10000],
                overrides
            ); 
            tx = await tx.wait();       
            const LINK_ERC20 = await ethers.getContractAt("IERC20", LINK_ADDRESS);
            const balance = (await LINK_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of LINK: "+balance.toString());

            console.log("Gas Used:", (tx.gasUsed).toString());

            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        });
        // ------------------------------------------------------------------------
        it("Swapping to UNI", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            };
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [UNI_ADDRESS],
                [10000],
                overrides
            ); 
            tx = await tx.wait();       
            const UNI_ERC20 = await ethers.getContractAt("IERC20", UNI_ADDRESS);
            const balance = (await UNI_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of UNI: "+balance.toString());
            
            console.log("Gas Used:", (tx.gasUsed).toString());

            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        });
        // ------------------------------------------------------------------------
        it("Should fail for bad percentage. Out of valid range [100,01%] (% > 1000)", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            }
            await expect(
                instanceToolV1.connect(signer).swapETHForTokens(
                    [USDT_ADDRESS],
                    [10001], // [100,01%]
                    overrides
                )).to.be.reverted;
            // Checking if any fee was sending to recipient
            expect(await signerALT.getBalance()).to.equal(0);
        });
        // ------------------------------------------------------------------------
        it("Should fail for bad percentage. Out of valid range [0%] (% < 1)", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            }
            await expect(
                instanceToolV1.connect(signer).swapETHForTokens(
                    [USDT_ADDRESS],
                    [0], // [0%]
                    overrides
                )).to.be.reverted;
            // Checking if any fee was sending to recipient
            expect(await signerALT.getBalance()).to.equal(0);
        });
    });

    describe("\n *-* CONTEXT: Swapping from ETH to 2 tokens", ()=>{
        it("Swapping to TWO tokens: 70% DAI and 30% USDT", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            };
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [DAI_ADDRESS, USDT_ADDRESS],
                [7000, 3000], // [70%, 30%]
                overrides
            ); 
            tx = await tx.wait();       
            const DAI_ERC20 = await ethers.getContractAt("IERC20", DAI_ADDRESS);
            const balance1 = (await DAI_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of DAI: "+balance1.toString());

            const USDT_ERC20 = await ethers.getContractAt("IERC20", USDT_ADDRESS);
            const balance2 = (await USDT_ERC20.balanceOf(ACCOUNT));
            console.log("2. Getting the balance of USDT: "+balance2.toString());

            console.log("Gas Used:", (tx.gasUsed).toString());

            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        });
        // ------------------------------------------------------------------
        it("Swapping to TWO tokens: 30% LINK and 70% UNI", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            };
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [LINK_ADDRESS, UNI_ADDRESS],
                [3000, 7000], // [70%, 30%]
                overrides
            ); 
            tx = await tx.wait();       
            const LINK_ERC20 = await ethers.getContractAt("IERC20", LINK_ADDRESS);
            const balance1 = (await LINK_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of LINK: "+balance1.toString());

            const UNI_ERC20 = await ethers.getContractAt("IERC20", UNI_ADDRESS);
            const balance2 = (await UNI_ERC20.balanceOf(ACCOUNT));
            console.log("2. Getting the balance of UNI: "+balance2.toString());

            console.log("Gas Used:", (tx.gasUsed).toString());

            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        });
        // ------------------------------------------------------------------
        it("Swapping to TWO tokens: 45.7% DAI and 54.3% LINK", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            };
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [DAI_ADDRESS, LINK_ADDRESS],
                [4570, 5430], // [45.7%, 54.3%]
                overrides
            ); 
            tx = await tx.wait();       
            const DAI_ERC20 = await ethers.getContractAt("IERC20", DAI_ADDRESS);
            const balance1 = (await DAI_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of DAI: "+balance1.toString());

            const LINK_ERC20 = await ethers.getContractAt("IERC20", LINK_ADDRESS);
            const balance2 = (await LINK_ERC20.balanceOf(ACCOUNT));
            console.log("2. Getting the balance of LINK: "+balance2.toString());

            console.log("Gas Used:", (tx.gasUsed).toString());

            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        });
        // ------------------------------------------------------------------------
        it("Should fail for bad percentage. Out of valid range [40%, 70%] (% > 1000)", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            }
            await expect(
                instanceToolV1.connect(signer).swapETHForTokens(
                    [LINK_ADDRESS, UNI_ADDRESS],
                    [4000, 7000], // [40%, 70%]
                    overrides
                )).to.be.reverted;

            expect(await signerALT.getBalance()).to.equal(0);
        });
    });

    describe("\n *-* CONTEXT: Swapping from ETH to 3 tokens", ()=>{
        it("Swapping to TRHEE tokens: 40% DAI, 25% USDT and 35% LINK", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            };
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [DAI_ADDRESS, USDT_ADDRESS, LINK_ADDRESS],
                [4000, 2500, 3500], // [40%, 25%, 35%]
                overrides
            ); 
            tx = await tx.wait();       
            const DAI_ERC20 = await ethers.getContractAt("IERC20", DAI_ADDRESS);
            const balance1 = (await DAI_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of DAI: "+balance1.toString());

            const USDT_ERC20 = await ethers.getContractAt("IERC20", USDT_ADDRESS);
            const balance2 = (await USDT_ERC20.balanceOf(ACCOUNT));
            console.log("2. Getting the balance of USDT: "+balance2.toString());

            const LINK_ERC20 = await ethers.getContractAt("IERC20", LINK_ADDRESS);
            const balance3 = (await LINK_ERC20.balanceOf(ACCOUNT));
            console.log("3. Getting the balance of LINK: "+balance3.toString());

            console.log("Gas Used:", (tx.gasUsed).toString());

            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        });
        // -------------------------------------------------------------
        it("Swapping to TRHEE tokens: 30.5% USDT, 40.3% LINK and 29.2% DAI", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            };
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [USDT_ADDRESS, LINK_ADDRESS, DAI_ADDRESS],
                [3050, 4030, 2920], // [30.5%, 40.3%, 29.2%]
                overrides
            ); 
            tx = await tx.wait();       
            const USDT_ERC20 = await ethers.getContractAt("IERC20", USDT_ADDRESS);
            const balance2 = (await USDT_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of USDT: "+balance2.toString());

            const LINK_ERC20 = await ethers.getContractAt("IERC20", LINK_ADDRESS);
            const balance3 = (await LINK_ERC20.balanceOf(ACCOUNT));
            console.log("2. Getting the balance of LINK: "+balance3.toString());

            const DAI_ERC20 = await ethers.getContractAt("IERC20", DAI_ADDRESS);
            const balance1 = (await DAI_ERC20.balanceOf(ACCOUNT));
            console.log("3. Getting the balance of DAI: "+balance1.toString());

            console.log("Gas Used:", (tx.gasUsed).toString());

            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        }); 
        // -------------------------------------------------------------
        it("Should fail for bad percentage. Out of valid range [40%, 40%, 30%] (% > 1000)", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            }
            await expect(
                instanceToolV1.connect(signer).swapETHForTokens(
                    [USDT_ADDRESS, LINK_ADDRESS, DAI_ADDRESS],
                    [4000, 4000, 3000], // [40%, 40%, 30%]
                    overrides
                )).to.be.reverted;
            expect(await signerALT.getBalance()).to.equal(0);
        });
    });

    describe("\n *-* CONTEXT: Swapping from ETH to 4 tokens", ()=>{
        
        it("Swapping to FOUR tokens: 30% DAI, 15% USDT, 35% LINK and 20% UNI", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            };
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [DAI_ADDRESS, USDT_ADDRESS, LINK_ADDRESS, UNI_ADDRESS],
                [3000, 1500, 3500, 2000], // [30%, 15%, 35%, 20%]
                overrides
            ); 
            tx = await tx.wait();       
            const DAI_ERC20 = await ethers.getContractAt("IERC20", DAI_ADDRESS);
            const balance1 = (await DAI_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of DAI: "+balance1.toString());

            const USDT_ERC20 = await ethers.getContractAt("IERC20", USDT_ADDRESS);
            const balance2 = (await USDT_ERC20.balanceOf(ACCOUNT));
            console.log("2. Getting the balance of USDT: "+balance2.toString());

            const LINK_ERC20 = await ethers.getContractAt("IERC20", LINK_ADDRESS);
            const balance3 = (await LINK_ERC20.balanceOf(ACCOUNT));
            console.log("3. Getting the balance of LINK: "+balance3.toString());

            const UNI_ERC20 = await ethers.getContractAt("IERC20", UNI_ADDRESS);
            const balance4 = (await UNI_ERC20.balanceOf(ACCOUNT));
            console.log("4. Getting the balance of UNI: "+balance4.toString());

            console.log("Gas Used:", (tx.gasUsed).toString());

            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        });
        // -------------------------------------------------------------
        it("Swapping to FOUR tokens: 25.1% USDT, 30.3% LINK, 20.4% UNI and 24.2% DAI", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            };
            let tx = await instanceToolV1.connect(signer).swapETHForTokens(
                [USDT_ADDRESS, LINK_ADDRESS, UNI_ADDRESS, DAI_ADDRESS],
                [2510, 3030, 2040, 2420], // [25.1%, 30.3%, 20.4%, 24.2%]
                overrides
            ); 
            tx = await tx.wait();       
            const USDT_ERC20 = await ethers.getContractAt("IERC20", USDT_ADDRESS);
            const balance1 = (await USDT_ERC20.balanceOf(ACCOUNT));
            console.log("\n1. Getting the balance of USDT: "+balance1.toString());

            const LINK_ERC20 = await ethers.getContractAt("IERC20", LINK_ADDRESS);
            const balance2 = (await LINK_ERC20.balanceOf(ACCOUNT));
            console.log("2. Getting the balance of LINK: "+balance2.toString());

            const UNI_ERC20 = await ethers.getContractAt("IERC20", UNI_ADDRESS);
            const balance3 = (await UNI_ERC20.balanceOf(ACCOUNT));
            console.log("3. Getting the balance of UNI: "+balance3.toString());

            const DAI_ERC20 = await ethers.getContractAt("IERC20", DAI_ADDRESS);
            const balance4 = (await DAI_ERC20.balanceOf(ACCOUNT));
            console.log("4. Getting the balance of DAI: "+balance4.toString());

            console.log("Gas Used:", (tx.gasUsed).toString());

            expect(await signerALT.getBalance()).to.equal(ethers.utils.parseEther("0.001"));
        }); 
        // -------------------------------------------------------------
        it("Should fail for bad percentage. Out of valid range [30%, 20%, 45%, 25%] (% > 1000)", async ()=>{
            let overrides = { 
                value: ethers.utils.parseEther("1"),
            }
            await expect(
                instanceToolV1.connect(signer).swapETHForTokens(
                    [DAI_ADDRESS, USDT_ADDRESS, LINK_ADDRESS, UNI_ADDRESS],
                    [3000, 2000, 4500, 2500], // [30%, 20%, 45%, 25%]
                    overrides
                )).to.be.reverted;
            expect(await signerALT.getBalance()).to.equal(0);
        });
    });
});