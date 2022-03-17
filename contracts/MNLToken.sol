//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "./ERC20Interface.sol";

contract MNLToken is ERC20Interface {

    string private _name = "Manul Token";
    string private _symbol = "MNT";
    uint8 private _decimals = 18;
    uint256 private _totalSupply;

    mapping(address => uint256) private _balance;

    mapping(address => mapping(address => uint256)) private _allowance;

    modifier validAddress(address _address) {
        require(_address != address(0), "Not valid address");
        _;
    }

    constructor(uint256 _initialSupply) {
        // TODO: use mint fn instead?
        _totalSupply = _initialSupply;
        _balance[msg.sender] = _totalSupply;
    }

    function name() external view override returns (string memory) {
        return _name;
    }

    function symbol() external view override returns (string memory) {
        return _symbol;
    }

    function decimals() external view override returns (uint8) {
        return _decimals;
    }

    function totalSupply() external view override returns (uint256) {
        return _totalSupply;
    }

    function balanceOf(address _owner) external view override returns (uint256 balance) {
        return _balance[_owner];
    }

    function transfer(address _to, uint256 _value) external validAddress(_to) override returns (bool success) {
        require(_value <= _balance[msg.sender], "Not enough tokens");

        _balance[msg.sender] -= _value;
        _balance[_to] += _value;

        emit Transfer(msg.sender, _to, _value);

        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value)
        external
        validAddress(_to)
        validAddress(_from)
        override
        returns (bool success)
    {
        // TODO: add variables
        require(_value <= _balance[_from], "Not enough tokens");
        require(_value <= _allowance[_from][msg.sender], "Not enough tokens");

        _balance[_from] -= _value;
        _allowance[_from][msg.sender] -= _value;
        _balance[_to] += _value;

        emit Transfer(_from, _to, _value);

        return true;
    }

    function approve(address _spender, uint256 _value) external validAddress(_spender) override returns (bool success) {
        _allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    function allowance(address _owner, address _spender) external view override returns (uint256 remaining) {
        return _allowance[_owner][_spender];
    }

    // TODO: manage fn visibility
    function mint(address _account, uint256 _amount) external validAddress(_account) {
        _totalSupply += _amount;
        _balance[_account] += _amount;

        emit Transfer(address(0), _account, _amount);
    }

    // TODO: manage fn visibility
    function burn(address _account, uint256 _amount) external validAddress(_account) {
        require(_amount <= _balance[_account], "Not enough tokens on balance to burn");

        _totalSupply -= _amount;
        _balance[_account] -= _amount;
        emit Transfer(_account, address(0), _amount);
    }


}
