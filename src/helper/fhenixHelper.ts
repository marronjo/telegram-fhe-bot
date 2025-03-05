import { ethers } from "ethers";
import { EncryptionTypes, FhenixClient, SupportedProvider } from "fhenixjs";

export async function getEncryptedNumber(contract: ethers.Contract, fhenixClient: FhenixClient, wallet: ethers.Wallet, provider: ethers.providers.JsonRpcProvider) : Promise<bigint> {
    const permit = await fhenixClient.generatePermit(contract.address, provider as unknown as SupportedProvider, wallet);
    if (!permit) throw new Error("Failed to get permit");

    const permission = fhenixClient.extractPermitPermission(permit);
    let result = await contract.getEncryptedNumber(permission);
    
    return fhenixClient.unseal(contract.address, result, wallet.address);
}

export async function setEncryptedNumber(contract: ethers.Contract, fhenixClient: FhenixClient, n: number) {
    const encNumber = await fhenixClient.encrypt(n, EncryptionTypes.uint8);
    await contract.setEncryptedNumber(encNumber);
}