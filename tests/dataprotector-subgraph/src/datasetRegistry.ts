import { Bytes, BigInt } from "@graphprotocol/graph-ts";
import { Dataset as DatasetContract } from "../generated/DatasetRegistry/Dataset";
import { Transfer as TransferEvent } from "../generated/DatasetRegistry/DatasetRegistry";
import { Account, ProtectedData, SchemaEntry } from "../generated/schema";
import { intToAddress } from "./utils";

export function handleTransferDataset(ev: TransferEvent): void {
  let contract = DatasetContract.bind(intToAddress(ev.params.tokenId));
  let id = contract._address;

  // Create and save the account entity
  let accountEntity = Account.load(contract.owner().toHex());
  if (!accountEntity) {
    accountEntity = new Account(contract.owner().toHex());
  }
  accountEntity.save();

  // Create and save the protectedData entity
  let protectedData = ProtectedData.load(id);
  if (!protectedData) {
    protectedData = new ProtectedData(id);
    // Set creationTimestamp only on first transfer
    protectedData.creationTimestamp = ev.block.timestamp;

    // Will be filled by the DatasetSchemaEvent.
    protectedData.jsonSchema = "";
    protectedData.schema = new Array<string>();
    protectedData.transactionHash = Bytes.fromHexString("0x");
    protectedData.blockNumber = BigInt.fromI32(0);
  }

  protectedData.owner = contract.owner().toHex();
  protectedData.name = contract.m_datasetName();
  protectedData.multiaddr = contract.m_datasetMultiaddr();
  protectedData.checksum = contract.m_datasetChecksum();

  protectedData.save();
}
