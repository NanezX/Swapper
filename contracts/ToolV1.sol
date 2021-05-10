// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "hardhat/console.sol";

contract ToolV1 is Initializable{
    address payable recipient; // Recipient that get the fees

    // Initialize function (as OZ recommend)
    function initialize(address payable _recipient) public initializer {
        recipient = _recipient;
    }
    // Function that swap ETH for Token(s);
    function swapETHForTokens (
        address[] memory AddressesTokensOut, // Token addresses that are requested 
        uint[] memory percentageTokens    // Token Percentages that are requested 
<<<<<<< HEAD
       ) 
       external 
       payable {
=======
    ) 
    external 
    payable {
>>>>>>> toolV2
            require(msg.value > 0);
            uint addIt;
            for(uint i=0; i < percentageTokens.length; i++ ){
                addIt+=percentageTokens[i]; // Adding to AddIt to check if percentages are corrects
            }
            // Checking if the parameters fit into range [1 - 10000] = [0.01% - 100%]
            require(addIt>0 && addIt<=10000, "Bad percentage parameters");

            IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
            uint fee = (msg.value*10)/10000; // Calculating the fee (0.1%) with bip
            uint amountETH = msg.value - fee; // Calculating the amount ETH available to transactions (Amount - fee)

            // Using a method iterative to make all the transactions
            for (uint i=0; i < AddressesTokensOut.length; i++ ){
                // Create the path between weth (ether) and the token
                address[] memory path = new address[](2); 
                path[0] = uniswapRouter.WETH(); 
                path[1] = AddressesTokensOut[i];

<<<<<<< HEAD
                // make the exchange
                uniswapRouter.swapExactETHForTokens{value:  (amountETH * percentageTokens[i])/10000}(
=======
                // Calculating % of Eth to send on this iteration. (Amount available * percentage that is requested) / Base percent
                uint amountInETH = (amountETH * percentageTokens[i])/10000;

                // make the exchange
                uniswapRouter.swapExactETHForTokens{value:  amountInETH}(
>>>>>>> toolV2
                    1,
                    path, 
                    msg.sender, 
                    block.timestamp + 3600
                ); 
            }
            recipient.call{value: fee}(""); // transfer fee to my recipient 
            msg.sender.call{ value: address(this).balance }(""); // refund the rest of ether
    }
    
    receive() payable external {} // Only receive the leftover ether
}