/** Chunk data container for belts and item slots. */
import { CHUNK_SIZE, SLOTS_PER_BELT } from "../util/MathUtil";
import { ITEM_NONE } from "./Entities";

export class Chunk {
  readonly cx: number;
  readonly cz: number;
  readonly beltDir: Int8Array;
  readonly beltSlots: Uint16Array;
  dirtyStatic = true;
  dirtyItems = true;

  constructor(cx: number, cz: number) {
    this.cx = cx;
    this.cz = cz;
    const tiles = CHUNK_SIZE * CHUNK_SIZE;
    this.beltDir = new Int8Array(tiles);
    this.beltDir.fill(-1);
    this.beltSlots = new Uint16Array(tiles * SLOTS_PER_BELT);
  }

  tileIndex(lx: number, lz: number): number {
    return lz * CHUNK_SIZE + lx;
  }

  slotIndex(tileIndex: number, slot: number): number {
    return tileIndex * SLOTS_PER_BELT + slot;
  }

  clearSlots(tileIndex: number): void {
    const start = tileIndex * SLOTS_PER_BELT;
    this.beltSlots.fill(ITEM_NONE, start, start + SLOTS_PER_BELT);
  }
}
