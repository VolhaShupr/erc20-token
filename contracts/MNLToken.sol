//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ERC20Interface.sol";

contract MNLToken is ERC20Interface, AccessControl {

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");

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

        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
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

    function transfer(address _to, uint256 _value) external override returns (bool success) {
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function transferFrom(address _from, address _to, uint256 _value) external override returns (bool success) {
        uint256 delegateAllowance = allowance(_from, msg.sender);

        require(_value <= delegateAllowance, "Not enough tokens");

        if (delegateAllowance != type(uint256).max) {
            unchecked {
                _allowance[_from][msg.sender] = delegateAllowance - _value;
            }
        }

        _transfer(_from, _to, _value);

        return true;
    }

    function approve(address _spender, uint256 _value) external validAddress(_spender) override returns (bool success) {
        _allowance[msg.sender][_spender] = _value;

        emit Approval(msg.sender, _spender, _value);

        return true;
    }

    function allowance(address _owner, address _spender) public view override returns (uint256 remaining) {
        return _allowance[_owner][_spender];
    }

    function mint(address _account, uint256 _amount) external onlyRole(MINTER_ROLE) validAddress(_account) {
        _totalSupply += _amount;
        _balance[_account] += _amount;

        emit Transfer(address(0), _account, _amount);
    }

    function burn(address _account, uint256 _amount) external onlyRole(BURNER_ROLE) validAddress(_account) {
        uint256 accountBalance = _balance[_account];

        require(_amount <= accountBalance, "Not enough tokens on balance to burn");

        _totalSupply -= _amount;
        unchecked {
            _balance[_account] = accountBalance - _amount;
        }

        emit Transfer(_account, address(0), _amount);
    }

    function _transfer(address _from, address _to, uint256 _value) private validAddress(_to) validAddress(_from) {
        uint256 ownerBalance = _balance[_from];

        require(_value <= ownerBalance, "Not enough tokens");

        unchecked {
            _balance[_from] = ownerBalance - _value;
        }
        _balance[_to] += _value;

        emit Transfer(_from, _to, _value);
    }


}
