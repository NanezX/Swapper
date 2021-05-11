const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const fetch = require("node-fetch");
const hre = require("hardhat");
// A bunch of address tokens
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const LINK_ADDRESS = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const UNI_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const ACCOUNT = "0xbF334f8BD1420a1CbFE15407f73919424934B1B3"; // This account will make transactions
const altAcc = "0x4Ef88F266D03eC2a3e3e1beb1D77cB9c52c93003"; // This account will receive the fees (recipient address)

describe("*** Transaction: Tool V2", ()=>{
    let ToolV1;
    let ToolV2;
    let instanceToolV1;
    let toolUpgradedV2;
    let signer;
    let signerALT;

    // To API
    let response;
    let data;
    let urlBase = `https://api.1inch.exchange/v3.0/1/quote?fromTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&`;
    let amountTypestokens=1;
    

    beforeEach(async ()=>{ 
        // Deploying
        ToolV1 = await ethers.getContractFactory("ToolV1");
        ToolV2 = await ethers.getContractFactory("ToolV2");

        // Upgrading
        instanceToolV1 = await upgrades.deployProxy(ToolV1, [altAcc]);
        toolUpgradedV2 = await upgrades.upgradeProxy(instanceToolV1.address, ToolV2);
        
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

    describe("\n    * Swapping from ETH to 1 tokens - Checking between Uniswap V2 and Balancer", ()=>{
// -----------------------------------------------
        it("Swapping to DAI", async ()=>{
            const tokenAddress = [DAI_ADDRESS];
            const tokenPercentage = [10000];
            const dexs = new Array(amountTypestokens);
            const tokenData = new Array(amountTypestokens);

            const amountETH = ethers.utils.parseEther("1");
            const overrides = { 
                value: amountETH,
            };
            
            // Checking and choosing between Uniswap and Balancer.
            for(let i=0; i< amountTypestokens;i++){
                response = await fetch(`${urlBase}toTokenAddress=${tokenAddress[i]}&amount=${amountETH}&protocols=UNISWAP_V2,BALANCER,WETH`);
                data = await response.json();
                tokenData[i] = data;
                dexs[i] =setDex(data);
            }

            let tx = await toolUpgradedV2.connect(signer).swapETHForTokens(
                tokenAddress,
                tokenPercentage,
                dexs,
                overrides
            ); 
            tx = await tx.wait();  

            await printResult(tokenData, tokenAddress, amountTypestokens);
            console.log("       Gas Used:", (tx.gasUsed).toString());
        });

        
    });

    describe("\n    * Swapping from ETH to 2 tokens - Checking between Uniswap V2 and Balancer", ()=>{
        before(async ()=>{
            amountTypestokens++;
        });
    // -----------------------------------------------
        it("Swapping to 40% DAI and 60% LINK", async ()=>{
            const tokenAddress = [DAI_ADDRESS, LINK_ADDRESS];
            const tokenPercentage = [4000, 6000]; // [40%, 60%]
            const dexs = new Array(amountTypestokens);
            const tokenData = new Array(amountTypestokens);

            const amountETH = ethers.utils.parseEther("1");
            const overrides = { 
                value: amountETH,
            };
            
            // Checking and choosing between Uniswap and Balancer.
            for(let i=0; i< amountTypestokens;i++){
                response = await fetch(`${urlBase}toTokenAddress=${tokenAddress[i]}&amount=${amountETH}&protocols=UNISWAP_V2,BALANCER,WETH`);
                data = await response.json();
                tokenData[i] = data;
                dexs[i] =setDex(data);
            }

            let tx = await toolUpgradedV2.connect(signer).swapETHForTokens(
                tokenAddress,
                tokenPercentage,
                dexs,
                overrides
            ); 
            tx = await tx.wait();  

            await printResult(tokenData, tokenAddress, amountTypestokens);
            console.log("       Gas Used:", (tx.gasUsed).toString());
        });
    });

    describe("\n    * Swapping from ETH to 3 tokens - Checking between Uniswap V2 and Balancer", ()=>{
        before(async ()=>{
            amountTypestokens++;
        });
    // -----------------------------------------------
        it("Swapping to 27% DAI, 33% LINK and 40% UNI", async ()=>{
            const tokenAddress = [DAI_ADDRESS, LINK_ADDRESS, UNI_ADDRESS];
            const tokenPercentage = [2700, 3300, 4000]; // [27%, 33%, 40%]
            const dexs = new Array(amountTypestokens);
            const tokenData = new Array(amountTypestokens);

            const amountETH = ethers.utils.parseEther("1");
            const overrides = { 
                value: amountETH,
            };
            
            // Checking and choosing between Uniswap and Balancer.
            for(let i=0; i< amountTypestokens;i++){
                response = await fetch(`${urlBase}toTokenAddress=${tokenAddress[i]}&amount=${amountETH}&protocols=UNISWAP_V2,BALANCER,WETH`);
                data = await response.json();
                tokenData[i] = data;
                dexs[i] =setDex(data);
            }

            let tx = await toolUpgradedV2.connect(signer).swapETHForTokens(
                tokenAddress,
                tokenPercentage,
                dexs,
                overrides
            ); 
            tx = await tx.wait();  

            await printResult(tokenData, tokenAddress, amountTypestokens);
            console.log("       Gas Used:", (tx.gasUsed).toString());
        });
    // -----------------------------------------------
        it("Swapping to 25.7% UNI, 40.1% DAI and 34.2% LINK", async ()=>{
            const tokenAddress = [UNI_ADDRESS, DAI_ADDRESS, LINK_ADDRESS];
            const tokenPercentage = [2570, 4010, 3420]; // [25.7%, 40.1%, 34.2%]
            const dexs = new Array(amountTypestokens);
            const tokenData = new Array(amountTypestokens);

            const amountETH = ethers.utils.parseEther("1");
            const overrides = { 
                value: amountETH,
            };
            
            // Checking and choosing between Uniswap and Balancer.
            for(let i=0; i< amountTypestokens;i++){
                response = await fetch(`${urlBase}toTokenAddress=${tokenAddress[i]}&amount=${amountETH}&protocols=UNISWAP_V2,BALANCER,WETH`);
                data = await response.json();
                tokenData[i] = data;
                dexs[i] =setDex(data);
            }

            let tx = await toolUpgradedV2.connect(signer).swapETHForTokens(
                tokenAddress,
                tokenPercentage,
                dexs,
                overrides
            ); 
            tx = await tx.wait();  

            await printResult(tokenData, tokenAddress, amountTypestokens);
            console.log("       Gas Used:", (tx.gasUsed).toString());
        });
    });

});
function setDex(_data){
    // Actually, i set ALL in "false" for testing only Balancer, but ill change later

    const name = _data.protocols[0][1][0].name;
    if (name == 'UNISWAP_V2'){
        // Return true, this will be Uniswap
        return true; 
    }else{
        // Return false, because i only set Uniswap and Balancer as Protocols
        return false;
    }

    // Comment/Uncommet the conditional if you wanna choose between Uniswap2 and Balancer
  /*
    return false;
  */
}

// Print the results. Parameters: 1. Data from API, 2. Token Addresses, 3. Amount of token types
async function printResult(_datas, _addresses, _amountTypes){
    for(let i = 0; i< _amountTypes; i++){
        let decimals = _datas[i].toToken.decimals;
        let tokenSymbol = _datas[i].toToken.symbol;
        decimals = Math.pow(10,(decimals));
        const Token_ERC20 = await ethers.getContractAt("IERC20", _addresses[i]);
        const balance = (await Token_ERC20.balanceOf(ACCOUNT));
        console.log(`${i==0 ? "\n" : "" }       ${i+1}. Getting the balance of ${tokenSymbol}: ${(balance.toString()) / decimals}`);
    }
}