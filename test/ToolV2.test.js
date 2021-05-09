const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");
const fetch = require("node-fetch");
const hre = require("hardhat");
// A bunch of address tokens
const DAI_ADDRESS = "0x6b175474e89094c44da98b954eedeac495271d0f";
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const LINK_ADDRESS = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const UNI_ADDRESS = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984";
const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

const ACCOUNT = "0xbF334f8BD1420a1CbFE15407f73919424934B1B3"; // This account will make transactions
const altAcc = "0x4Ef88F266D03eC2a3e3e1beb1D77cB9c52c93003"; // This account will receive the fees (recipient address)
const ALCHEMY_KEY = "7rjyfJ9o5dWSND5dUhl1sfFjQpG24BlV";

describe("Transaction v2", ()=>{
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
    let amountTypestokens;
    

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

    describe("\n *-* CONTEXT: Checking api", ()=>{
// -----------------------------------------------
        amountTypestokens=1;
        it("Using the api with 1 token", async ()=>{
            // Arrays
            const tokenAddress = [USDT_ADDRESS];
            const tokenPercentage = [10000];
            const dexs = new Array(amountTypestokens);

            let amountETH = ethers.utils.parseEther("1");
            // Checking and choosing between Uniswap and Balancer.
            for(let i=0; i< amountTypestokens;i++){
                response = await fetch(`${urlBase}toTokenAddress=${tokenAddress[i]}&amount=${amountETH}&protocols=UNISWAP_V2,BALANCER,WETH`);
                data = await response.json();
                dexs[i] = setDex(data);
            }
            // let overrides = { 
            //     value: amountETH,
            // };
            let tx = await toolUpgradedV2.connect(signer).swapETHForTokens(
                tokenAddress,
                tokenPercentage,
                dexs,
                { 
                    value: amountETH,
                }
            ); 
            tx = await tx.wait();  

           

        });

        
    });

});
function setDex(_data){
    if (_data.protocols[0][1][0].name == 'UNISWAP_V2'){
        // Return true, this will be Uniswap
        return true; 
    }else{
        // Return false, because i only set Uniswap and Balancer as Protocols
        return false;
    }
}