// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import { FHE, inEuint8, euint8 } from "@fhenixprotocol/contracts/FHE.sol";
import { Permissioned, Permission } from "@fhenixprotocol/contracts/access/Permissioned.sol";

contract SimpleStorage is Permissioned {
    euint8 public encryptedNumber;

    function setEncryptedNumber(inEuint8 calldata _encryptedNumber) public {
        encryptedNumber = FHE.asEuint8(_encryptedNumber);
    }

    function getEncryptedNumber(Permission memory permission) public view returns (string memory) {
        return FHE.sealoutput(encryptedNumber, permission.publicKey);
    }
}
