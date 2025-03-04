// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { Test } from "forge-std/src/Test.sol";

import { FHE, inEuint8, euint8 } from "@fhenixprotocol/contracts/FHE.sol";
import { Permissioned, Permission } from "@fhenixprotocol/contracts/access/Permissioned.sol";
import { Permission, PermissionHelper } from "../util/PermissionHelper.sol";
import { SimpleStorage } from "../src/SimpleStorage.sol";
import { FheEnabled } from "../util/FheHelper.sol";

contract SimpleStorageTest is Test, FheEnabled {
    address public user;
    uint256 public userPrivateKey;
    PermissionHelper private simpleStoragePermissionHelper;
    Permission private simpleStoragePermission;

    SimpleStorage private simpleStorage;

    function setUp() public {
        initializeFhe();

        userPrivateKey = 0xA11CE;
        user = vm.addr(userPrivateKey);

        simpleStorage = new SimpleStorage();

        simpleStoragePermissionHelper = new PermissionHelper(address(simpleStorage));
        simpleStoragePermission = simpleStoragePermissionHelper.generatePermission(userPrivateKey);
    }

    function testSetEncryptedNumber() public {
        uint8 input = 45;
        inEuint8 memory eInput = encrypt8(input);

        simpleStorage.setEncryptedNumber(eInput);

        string memory encryptedNumber = simpleStorage.getEncryptedNumber(simpleStoragePermission);
        uint256 output = unseal(address(simpleStorage), encryptedNumber);

        assertEq(input, uint8(output));
    }
}
