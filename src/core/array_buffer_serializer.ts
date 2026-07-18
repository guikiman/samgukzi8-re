import type { GameState, FactionState, OfficerState, CityState } from "./sisyphus_orchestrator";

const MAGIC_BYTES = new Uint8Array([0x52, 0x54, 0x4B, 0x38]);
const HEADER_SIZE = 16;

export enum FieldType {
  UINT8 = 0,
  INT32 = 1,
  UINT32 = 2,
  FLOAT32 = 3,
  STRING = 4,
  BOOL = 5,
}

export interface BinaryLayout {
  fields: Array<{ key: string; type: FieldType }>;
  arrayFields: Array<{ key: string; itemType: FieldType }>;
}

export function classifyState(state: GameState): BinaryLayout {
  return {
    fields: [
      { key: "currentTurn", type: FieldType.INT32 },
      { key: "seed", type: FieldType.UINT32 },
    ],
    arrayFields: [],
  };
}

export function serializeStateToBuffer(state: GameState): ArrayBuffer {
  const json = JSON.stringify(state);
  const encoder = new TextEncoder();
  const jsonBytes = encoder.encode(json);

  const jsonLen = jsonBytes.length;
  const totalSize = HEADER_SIZE + 4 + jsonLen;

  const buffer = new ArrayBuffer(totalSize);
  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  let offset = 0;
  bytes.set(MAGIC_BYTES, offset);
  offset += 4;

  view.setUint32(offset, 1, true);
  offset += 4;

  view.setUint32(offset, Date.now(), true);
  offset += 4;

  view.setUint32(offset, state.currentTurn, true);
  offset += 4;

  view.setUint32(offset, jsonLen, true);
  offset += 4;

  bytes.set(jsonBytes, offset);
  offset += jsonLen;

  const fnvHash = computeBinaryChecksum(new Uint8Array(buffer, 0, offset));
  const finalBuffer = new ArrayBuffer(offset + 4);
  new Uint8Array(finalBuffer).set(new Uint8Array(buffer, 0, offset));
  new DataView(finalBuffer).setUint32(offset, fnvHash, true);

  return finalBuffer;
}

export function deserializeStateFromBuffer(buffer: ArrayBuffer): GameState {
  const bytes = new Uint8Array(buffer);
  const view = new DataView(buffer);

  let offset = 0;
  const magic = bytes.slice(0, 4);
  const magicMatch = MAGIC_BYTES.every((b, i) => b === magic[i]);
  if (!magicMatch) {
    throw new Error("Invalid binary format: magic bytes mismatch");
  }
  offset += 4;

  const version = view.getUint32(offset, true);
  offset += 4;

  const timestamp = view.getUint32(offset, true);
  offset += 4;

  const turn = view.getUint32(offset, true);
  offset += 4;

  const jsonLen = view.getUint32(offset, true);
  offset += 4;

  const jsonBytes = bytes.slice(offset, offset + jsonLen);
  offset += jsonLen;

  const storedChecksum = view.getUint32(offset, true);
  const computedChecksum = computeBinaryChecksum(bytes.slice(0, offset));
  if (storedChecksum !== computedChecksum) {
    throw new Error(`Binary checksum mismatch: stored=${storedChecksum}, computed=${computedChecksum}`);
  }

  const json = new TextDecoder().decode(jsonBytes);
  return JSON.parse(json) as GameState;
}

export function estimateBinarySize(state: GameState): number {
  const json = JSON.stringify(state);
  return HEADER_SIZE + 4 + json.length + 4;
}

const FNV_OFFSET_BASIS = 0x811C9DC5;
const FNV_PRIME = 0x01000193;

function computeBinaryChecksum(data: Uint8Array): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < data.length; i++) {
    hash ^= data[i];
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash >>> 0;
}