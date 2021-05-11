// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./interfaces/InterfaceToken.sol";
import "./interfaces/IBalancerPool.sol";
import "hardhat/console.sol";

contract ToolV2 is Initializable{
    address payable public recipient; // Recipient that get the fees

    function initialize(address payable _recipient) public initializer {
        recipient = _recipient;
    }

    function swapETHForTokens (
        address[] memory AddressesTokensOut,
        uint[] memory percentageTokens,
        bool[] memory dex  // True to Uniswap, False to Balancer
     )
     external 
     payable {

        require(msg.value > 0, "Has been not send any ether");
        uint addIt;
        for(uint i=0; i < percentageTokens.length; i++ ){
            addIt+=percentageTokens[i];
        }
        require(addIt>0 && addIt<=10000, "Bad percentage parameters");
        

        uint fee = (msg.value*10)/10000; 
        uint amountETH = msg.value - fee;

        for (uint i=0; i < AddressesTokensOut.length; i++ ){
            uint ETHToUse = (amountETH * percentageTokens[i])/10000;
            if(dex[i]){
                _swapFromUniswap(ETHToUse, AddressesTokensOut[i]);
            }else{
                _swapFromBalancer(ETHToUse, AddressesTokensOut[i]);
            }
        }
        recipient.call{value: fee}(""); // transfer fee to my recipient 
        msg.sender.call{ value: address(this).balance}(""); // refund the rest of ether
    }

    function _swapFromUniswap(
        uint _amountInETH, 
        address _addressTokenOut
     ) 
     internal {
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

        address[] memory path = new address[](2); 
        path[0] = uniswapRouter.WETH(); 
        path[1] = _addressTokenOut;

        uniswapRouter.swapExactETHForTokens{value:  _amountInETH}(
            1, 
            path, 
            msg.sender, 
            block.timestamp + 3600
        ); 
    }

    function _swapFromBalancer(
        uint _amountInETH,
        address _addressTokenOut
     ) 
     internal{
        IBalancerPool balancer = IBalancerPool(0x7226DaaF09B3972320Db05f5aB81FF38417Dd687);
        InterfaceToken weth = InterfaceToken(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
        IERC20Upgradeable token = IERC20Upgradeable(_addressTokenOut);

        address[] memory addr =balancer.getBestPoolsWithLimit(address(weth), _addressTokenOut, 1);
        IBalancerPool _pool = IBalancerPool(addr[0]);

        weth.deposit{ value: _amountInETH }();
        weth.approve(address(_pool),_amountInETH);

        uint price = _pool.getSpotPrice(address(weth), _addressTokenOut);
        price=(105*price)/100;
        
        _pool.swapExactAmountIn(address(weth), _amountInETH, _addressTokenOut, 1, price);
        token.transfer(msg.sender, token.balanceOf(address(this)));
        // refund leftover WETH
        weth.withdraw(weth.balanceOf(address(this)));
    }

    receive() payable external {} // Only receive the leftover ether

}