const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const fetch = require("node-fetch");
const hre = require("hardhat");
// A bunch of address tokens
const DAI_ADDRESS = "0x6B175474E89094C44Da98b954EedeAC495271d0F";
const LINK_ADDRESS = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const UNI_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const WETH_ADDRESS = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";

const ACCOUNT = "0xbF334f8BD1420a1CbFE15407f73919424934B1B3"; // This account will make transactions
const recipient = "0x4Ef88F266D03eC2a3e3e1beb1D77cB9c52c93003"; // This account will receive the fees (recipient address)

describe("*** Deploying and Upgrading", ()=>{
    let ToolV1;
    let ToolV2;
    let instanceToolV1;
    let UpgradedV2;
    let signer;
    let recipientSigned;

    // To API
    let response;
    let data;
    let urlBase = `https://api.1inch.exchange/v3.0/1/quote?fromTokenAddress=0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE&`;
    
    before(async ()=> {
        // Impersonating ACCOUNT and set signer
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [ACCOUNT]
        });
        signer = await ethers.provider.getSigner(ACCOUNT);

        // Impersonating the recipient
        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [recipient]
        });
        recipientSigned = await ethers.provider.getSigner(recipient);

        // Getting ether from a miner (because im poor D: )
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
    });

    it("Deploying V1 and use it", async () =>{
        // Deploying
        ToolV1 = await ethers.getContractFactory("ToolV1");
        instanceToolV1 = await upgrades.deployProxy(ToolV1, [recipient]);

        // Arrays(data) to make the transaction (2 tokens)
        const tokenAddress = [DAI_ADDRESS, LINK_ADDRESS];
        const tokenPercentage = [4530, 5470]; // [45.3%, 54.7%]
        const tokenData = new Array(2);

        const amountETH = ethers.utils.parseEther("1");
        const overrides = { 
            value: amountETH,
        };

        // Filling tokenData with API
        for(let i=0; i< tokenData.length;i++){
            response = await fetch(`${urlBase}toTokenAddress=${tokenAddress[i]}&amount=${amountETH}&protocols=UNISWAP_V2,WETH`);
            data = await response.json();
            tokenData[i] = data;
        }

        // Making the transaction
        let tx = await instanceToolV1.connect(signer).swapETHForTokens(
            tokenAddress,
            tokenPercentage,
            overrides 
        ); 
        tx = await tx.wait(); 

        // Obtaining balance of Tokens. (Declared at the end)
        await printResult(tokenData, tokenAddress, 2);
        // Gas used :)
        console.log("       Gas Used:", (tx.gasUsed).toString());
        // Confirming the recipient 
        expect(await instanceToolV1.recipient()).to.equal(recipient);
    });

    it("Updating to V2 and use it", async () =>{
        // Upgrading
        ToolV2 = await ethers.getContractFactory("ToolV2");
        UpgradedV2 = await upgrades.upgradeProxy(instanceToolV1.address, ToolV2);

        // Arrays(data) to make the transaction (2 tokens)
        const tokenAddress = [DAI_ADDRESS, LINK_ADDRESS];
        const tokenPercentage = [4530, 5470]; // [45.3%, 54.7%]
        const dexs = new Array(2);
        const tokenData = new Array(2);

        const amountETH = ethers.utils.parseEther("1");
        const overrides = { 
            value: amountETH,
        };

        // Choosing between Uniswap and Balancer. (Declared at the end)
        for(let i=0; i< tokenData.length;i++){
            response = await fetch(`${urlBase}toTokenAddress=${tokenAddress[i]}&amount=${amountETH}&protocols=UNISWAP_V2,BALANCER,WETH`);
            data = await response.json();
            tokenData[i] = data;
            dexs[i] =setDex(data);
        }

        let tx = await UpgradedV2.connect(signer).swapETHForTokens(
            tokenAddress,
            tokenPercentage,
            dexs,
            overrides
        ); 
        tx = await tx.wait(); 

        await printResult(tokenData, tokenAddress, 2);
        console.log("       Gas Used:", (tx.gasUsed).toString());
        // Confirming the recipient 
        expect(await UpgradedV2.recipient()).to.equal(recipient);
    });
});

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
// Set which DEX will swap what token
function setDex(_data){
  
    const name = _data.protocols[0][1][0].name;
    if (name == 'UNISWAP_V2'){
        // Return true, this will be Uniswap
        return true; 
    }else{
        // Return false, because i only set Uniswap or Balancer as Protocols
        return false;
    }
    // Just put return false/true for specify a DEX
}