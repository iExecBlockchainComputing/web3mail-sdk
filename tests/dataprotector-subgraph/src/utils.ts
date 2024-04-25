import { Address, BigInt } from "@graphprotocol/graph-ts";

export function intToAddress(value: BigInt): Address {
  return Address.fromString(
    value
      .toHex()
      .substring(2)
      .padStart(40, "0")
  ) as Address;
}
