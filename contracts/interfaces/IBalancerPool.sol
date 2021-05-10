// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
interface IBalancerPool {
    function swapExactAmountIn(address, uint, address, uint, uint) external returns (uint, uint);
    function swapExactAmountOut(address, uint, address, uint, uint) external returns (uint, uint);
    function getSpotPrice(address, address) external view returns (uint);

    function getBestPoolsWithLimit(address fromToken, address destToken, uint256 limit) external returns(address[] memory);
}