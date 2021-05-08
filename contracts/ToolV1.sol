// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "hardhat/console.sol";

contract ToolV1 is Initializable{
    address payable recipient;

    function initialize(address payable _recipient) public initializer {
        recipient = _recipient;
    }

    function swapETHForTokens (
        address[] memory AddressesTokensOut,
        uint[] memory percentageTokens
        ) external payable {
            IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
            uint fee = (msg.value*10)/10000; // get the fee (0.1% ) with bip
            uint amountETH = msg.value - fee; // Getting amount ETH available to transactions 

            for (uint i=0; i < AddressesTokensOut.length; i++ ){
                // Create the path between weth (ether) and the token
                address[] memory path = new address[](2); 
                path[0] = uniswapRouter.WETH(); 
                path[1] = AddressesTokensOut[i];

                // Calculating % of Eth to send on this iteration
                uint amountInETH = (amountETH * percentageTokens[i])/10000;
                // Set the aprox amount of tokent that received
                uint[] memory amounts = uniswapRouter.getAmountsOut(amountInETH, path);
                uint amountToSend = amounts[amounts.length-1];
                // make the exchange
                uniswapRouter.swapETHForExactTokens{value: amountInETH}(
                    amountToSend, 
                    path, 
                    msg.sender, 
                    block.timestamp + 3600
                ); 
            }
            recipient.call{value: fee}; // transfer fee to my recipient 
            (bool success,) = msg.sender.call{ value: address(this).balance }(""); // refund the rest of ether
            require(success, "refund failed");
    }
    
    receive() payable external {} // Just receive refund ether.
}