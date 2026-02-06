/** Simulation stepper for belt item movement. */
import { Chunk } from "../world/Chunk";
import { ITEM_NONE } from "../world/Entities";
import { CHUNK_SIZE, Dir, DIR_OFFSETS, SLOTS_PER_BELT, chunkKey } from "../util/MathUtil";
import { World } from "../world/World";

type Transfer = {
  fromChunk: Chunk;
  fromIndex: number;
  toChunk: Chunk;
  toIndex: number;
};

export class Simulator {
  private transfers: Transfer[] = [];

  tick(world: World, activeChunks: Chunk[]): void {
    this.transfers.length = 0;
    const activeKeys = new Set(activeChunks.map((chunk) => chunkKey(chunk.cx, chunk.cz)));

    for (const chunk of activeChunks) {
      const beltDir = chunk.beltDir;
      for (let index = 0; index < beltDir.length; index += 1) {
        const dir = beltDir[index];
        if (dir < 0) {
          continue;
        }
        const base = index * SLOTS_PER_BELT;
        for (let slot = SLOTS_PER_BELT - 1; slot >= 1; slot -= 1) {
          const currentIndex = base + slot;
          const prevIndex = base + slot - 1;
          if (chunk.beltSlots[currentIndex] === ITEM_NONE && chunk.beltSlots[prevIndex] !== ITEM_NONE) {
            chunk.beltSlots[currentIndex] = chunk.beltSlots[prevIndex];
            chunk.beltSlots[prevIndex] = ITEM_NONE;
            chunk.dirtyItems = true;
          }
        }

        const frontIndex = base + (SLOTS_PER_BELT - 1);
        const itemId = chunk.beltSlots[frontIndex];
        if (itemId === ITEM_NONE) {
          continue;
        }

        const lx = index % CHUNK_SIZE;
        const lz = Math.floor(index / CHUNK_SIZE);
        const offset = DIR_OFFSETS[dir as Dir];
        const tx = chunk.cx * CHUNK_SIZE + lx + offset.dx;
        const tz = chunk.cz * CHUNK_SIZE + lz + offset.dz;
        const target = world.getChunkForTile(tx, tz, false);
        if (!target) {
          continue;
        }
        const targetKey = chunkKey(target.chunk.cx, target.chunk.cz);
        if (!activeKeys.has(targetKey)) {
          continue;
        }
        const targetIndex = target.chunk.tileIndex(target.lx, target.lz);
        if (target.chunk.beltDir[targetIndex] < 0) {
          continue;
        }
        const targetSlotIndex = target.chunk.slotIndex(targetIndex, 0);
        if (target.chunk.beltSlots[targetSlotIndex] !== ITEM_NONE) {
          continue;
        }
        this.transfers.push({
          fromChunk: chunk,
          fromIndex: frontIndex,
          toChunk: target.chunk,
          toIndex: targetSlotIndex,
        });
      }
    }

    for (const transfer of this.transfers) {
      transfer.toChunk.beltSlots[transfer.toIndex] = transfer.fromChunk.beltSlots[transfer.fromIndex];
      transfer.fromChunk.beltSlots[transfer.fromIndex] = ITEM_NONE;
      transfer.fromChunk.dirtyItems = true;
      transfer.toChunk.dirtyItems = true;
    }
  }
}
