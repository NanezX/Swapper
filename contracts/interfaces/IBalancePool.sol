// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
interface IBalancePool {
    function swapExactAmountIn(address, uint, address, uint, uint) external returns (uint, uint);
    function swapExactAmountOut(address, uint, address, uint, uint) external returns (uint, uint);
    function getSpotPrice(address, address) external view returns (uint);
}