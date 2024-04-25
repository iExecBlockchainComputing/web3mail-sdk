import {
  JSONValue,
  JSONValueKind,
  Result,
  TypedMap,
  json,
} from "@graphprotocol/graph-ts";
import { DatasetSchema as DatasetSchemaEvent } from "../generated/DataProtector/DataProtector";
import { ProtectedData, SchemaEntry } from "../generated/schema";
import { AUTHORIZED_CHARACTERS } from "./types";

const PATH_SEPARATOR = ".";
const DataSchemaEntryType = [
  "boolean",
  "number",
  "string",
  // MIME types supported by dataprotector
  "application/octet-stream",
  "application/pdf",
  "application/xml",
  "application/zip",
  "audio/midi",
  "audio/mpeg",
  "audio/x-wav",
  "image/bmp",
  "image/gif",
  "image/jpeg",
  "image/png",
  "image/webp",
  "video/mp4",
  "video/mpeg",
  "video/x-msvideo",
];

export function handleDatasetSchema(event: DatasetSchemaEvent): void {
  const id = event.params.dataset;

  let protectedData = ProtectedData.load(id);
  if (protectedData) {
    protectedData.jsonSchema = event.params.schema;
    protectedData.schema = new Array<string>();
    protectedData.blockNumber = event.block.number;
    protectedData.transactionHash = event.transaction.hash;

    const schema: Result<JSONValue, boolean> = json.try_fromString(
      event.params.schema
    );

    if (schema.isOk) {
      const avalaibleSchema: TypedMap<
        string,
        JSONValue
      > = schema.value.toObject();

      const entries = recursiveParse(avalaibleSchema);
      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const entryId = entry.path + ":" + entry.type.toString(); // create a unique id for the entry
        let entryEntity = SchemaEntry.load(entryId);
        if (!entryEntity) {
          entryEntity = new SchemaEntry(entryId);
        }
        entryEntity.path = entry.path;
        entryEntity.type = entry.type.toString() || "";
        entryEntity.save();

        const schema = protectedData.schema;
        schema.push(entryEntity.id);
        protectedData.schema = schema;
      }
    }
    protectedData.save();
  }
}

class ISchemaEntry {
  path: string;
  type: string;
}

function recursiveParse(
  typedMap: TypedMap<string, JSONValue>,
  parentPath: string = ""
): Array<ISchemaEntry> {
  let accumulator: Array<ISchemaEntry> = new Array();
  for (let i = 0; i < typedMap.entries.length; i++) {
    const entry = typedMap.entries[i];
    const path = `${parentPath !== "" ? parentPath + PATH_SEPARATOR : ""}${
      entry.key
    }`;

    if (entry.key.trim() === "" || containsSpecialCharacters(entry.key)) {
      continue;
    }

    if (entry.value.kind == JSONValueKind.OBJECT) {
      const object = entry.value.toObject();
      for (let i = 0; i < object.entries.length; i++) {
        accumulator = accumulator.concat(recursiveParse(object, path));
      }
    } else if (entry.value.kind == JSONValueKind.STRING) {
      if (DataSchemaEntryType.includes(entry.value.toString())) {
        accumulator = accumulator.concat([
          {
            path,
            type: entry.value.toString(),
          },
        ]);
      }
    }
  }
  return accumulator;
}

function containsSpecialCharacters(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (!AUTHORIZED_CHARACTERS.includes(str[i])) {
      return true;
    }
  }
  return false;
}
