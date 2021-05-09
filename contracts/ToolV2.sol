// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "./interfaces/InterfaceToken.sol";
import "./interfaces/IBalancePool.sol";
import "hardhat/console.sol";
// Balancer Exchange Proxy: 0x3E66B66Fd1d0b02fDa6C811Da9E0547970DB2f21

contract ToolV2 is Initializable{
    address payable recipient; // Recipient that get the fees

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

        require(msg.value > 0);
        uint addIt;
        for(uint i=0; i < percentageTokens.length; i++ ){
            addIt+=percentageTokens[i];
        }
        require(addIt>0 && addIt<=10000, "Bad percentage parameters");
        
        IUniswapV2Router02 uniswapRouter = IUniswapV2Router02(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);
        IBalancePool balancer = IBalancePool(0x7aFE74AE3C19f070c109A38C286684256ADC656C);

        uint fee = (msg.value*10)/10000; 
        uint amountETH = msg.value - fee;

        for (uint i=0; i < AddressesTokensOut.length; i++ ){
            uint ETHToUse = (amountETH * percentageTokens[i])/10000;
            if(dex[i]){
                _swapFromUniswap(uniswapRouter, ETHToUse, AddressesTokensOut[i]);
            }else{
                console.log("Balancer");
                _swapFromBalancer(balancer, ETHToUse, AddressesTokensOut[i]);
            }
        }
        recipient.call{value: fee}(""); // transfer fee to my recipient 
        msg.sender.call{ value: address(this).balance }(""); // refund the rest of ether
    }

    function _swapFromUniswap(
        IUniswapV2Router02 _uniswap, 
        uint _amountInETH, 
        address _addressTokenOut
     ) 
     internal {

        address[] memory path = new address[](2); 
        path[0] = _uniswap.WETH(); 
        path[1] = _addressTokenOut;

        _uniswap.swapExactETHForTokens{value:  _amountInETH}(
            1, 
            path, 
            msg.sender, 
            block.timestamp + 3600
        ); 
    }

    function _swapFromBalancer(
        IBalancePool _balancer,
        uint _amountInETH,
        address _addressTokenOut
     ) 
     internal{
        InterfaceToken weth = InterfaceToken(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
        IERC20Upgradeable token = IERC20Upgradeable(_addressTokenOut);

        weth.deposit{ value: _amountInETH }();
        weth.approve(address(_balancer),_amountInETH);

        uint price = _balancer.getSpotPrice(address(weth), _addressTokenOut);
        price=(110*price)/100;
        
        _balancer.swapExactAmountIn(address(weth), _amountInETH, _addressTokenOut, 1, price);
        
        token.transfer(msg.sender, token.balanceOf(address(this)));

        uint wethBalance = weth.balanceOf(address(this));
        if (wethBalance > 0) {
            // refund leftover ETH
            weth.withdraw(wethBalance);
        }
    }

    receive() payable external {} // Only receive the leftover ether

}