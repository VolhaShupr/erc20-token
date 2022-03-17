//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

interface ERC20Interface {

    /// @dev Returns the name of the token
    function name() external view returns (string memory);

    /// @dev Returns the symbol of the token
    function symbol() external view returns (string memory);

    /// @dev Returns the number of decimals the token uses
    function decimals() external view returns (uint8);

    /// @dev Returns the number of all tokens allocated by this contract regardless of owner
    function totalSupply() external view returns (uint256);

    /// @dev Returns the current token balance of an account, identified by its owner’s address
    function balanceOf(address _owner) external view returns (uint256 balance);

    /// @dev Transfers _value amount of tokens to address _to, fires the Transfer event
    function transfer(address _to, uint256 _value) external returns (bool success);

    /// @dev Transfers _value amount of tokens from address _from to address _to, fires the Transfer event
    function transferFrom(address _from, address _to, uint256 _value) external returns (bool success);

    /// @dev Allows _spender to withdraw from your account multiple times, up to the _value amount
    function approve(address _spender, uint256 _value) external returns (bool success);

    /// @dev Returns the amount which _spender is still allowed to withdraw from _owner
    function allowance(address _owner, address _spender) external view returns (uint256 remaining);

    /// @dev Triggered when tokens are transferred, including zero value transfers
    event Transfer(address indexed _from, address indexed _to, uint256 _value);

    /// @dev Triggered on any successful call to approve method
    event Approval(address indexed _owner, address indexed _spender, uint256 _value);
}
