// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";

contract ToolV2 is Initializable{
    address payable recipient; // Recipient that get the fees

    function initialize(address payable _recipient) public initializer {
        recipient = _recipient;
    }
}