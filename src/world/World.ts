/** World chunk map and coordinate helper utilities. */
import * as THREE from "three";
import { CHUNK_SIZE, TILE_SIZE, chunkKey } from "../util/MathUtil";
import { Chunk } from "./Chunk";
import { itemRegistry, ITEM_NONE } from "./Entities";

export type TileCoord = { tx: number; tz: number };
export type ChunkCoord = { cx: number; cz: number; lx: number; lz: number };

export class World {
  readonly chunks = new Map<string, Chunk>();

  worldToTile(pos: THREE.Vector3): TileCoord {
    return { tx: Math.floor(pos.x / TILE_SIZE), tz: Math.floor(pos.z / TILE_SIZE) };
  }

  tileToWorld(tx: number, tz: number, out?: THREE.Vector3): THREE.Vector3 {
    const x = (tx + 0.5) * TILE_SIZE;
    const z = (tz + 0.5) * TILE_SIZE;
    if (out) {
      out.set(x, 0, z);
      return out;
    }
    return new THREE.Vector3(x, 0, z);
  }

  tileToChunk(tx: number, tz: number): ChunkCoord {
    const cx = Math.floor(tx / CHUNK_SIZE);
    const cz = Math.floor(tz / CHUNK_SIZE);
    const lx = tx - cx * CHUNK_SIZE;
    const lz = tz - cz * CHUNK_SIZE;
    return { cx, cz, lx, lz };
  }

  getChunk(cx: number, cz: number, create = true): Chunk | undefined {
    const key = chunkKey(cx, cz);
    let chunk = this.chunks.get(key);
    if (!chunk && create) {
      chunk = new Chunk(cx, cz);
      this.chunks.set(key, chunk);
    }
    return chunk;
  }

  getChunkForTile(tx: number, tz: number, create = true): { chunk: Chunk; lx: number; lz: number } | undefined {
    const { cx, cz, lx, lz } = this.tileToChunk(tx, tz);
    const chunk = this.getChunk(cx, cz, create);
    if (!chunk) {
      return undefined;
    }
    return { chunk, lx, lz };
  }

  placeBelt(tx: number, tz: number, dir: number): void {
    const data = this.getChunkForTile(tx, tz, true);
    if (!data) {
      return;
    }
    const { chunk, lx, lz } = data;
    const index = chunk.tileIndex(lx, lz);
    chunk.beltDir[index] = dir;
    chunk.clearSlots(index);
    chunk.dirtyStatic = true;
    chunk.dirtyItems = true;
  }

  removeEntity(tx: number, tz: number): void {
    const data = this.getChunkForTile(tx, tz, false);
    if (!data) {
      return;
    }
    const { chunk, lx, lz } = data;
    const index = chunk.tileIndex(lx, lz);
    chunk.beltDir[index] = -1;
    chunk.clearSlots(index);
    chunk.dirtyStatic = true;
    chunk.dirtyItems = true;
  }

  getActiveChunks(center: THREE.Vector3, radius: number): Chunk[] {
    const { tx, tz } = this.worldToTile(center);
    const { cx, cz } = this.tileToChunk(tx, tz);
    const results: Chunk[] = [];
    for (let dz = -radius; dz <= radius; dz += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        const chunk = this.getChunk(cx + dx, cz + dz, true);
        if (chunk) {
          results.push(chunk);
        }
      }
    }
    return results;
  }

  injectItem(tx: number, tz: number, itemName: string): void {
    const data = this.getChunkForTile(tx, tz, false);
    if (!data) {
      return;
    }
    const { chunk, lx, lz } = data;
    const index = chunk.tileIndex(lx, lz);
    if (chunk.beltDir[index] < 0) {
      return;
    }
    const slotIndex = chunk.slotIndex(index, 0);
    if (chunk.beltSlots[slotIndex] !== ITEM_NONE) {
      return;
    }
    chunk.beltSlots[slotIndex] = itemRegistry.getId(itemName);
    chunk.dirtyItems = true;
  }

  serializeChunks(chunks: Chunk[]): string {
    const payload = chunks.map((chunk) => ({
      cx: chunk.cx,
      cz: chunk.cz,
      beltDir: Array.from(chunk.beltDir),
      beltSlots: Array.from(chunk.beltSlots),
    }));
    return JSON.stringify({ version: 1, chunks: payload });
  }

  loadFromJSON(json: string): void {
    const data = JSON.parse(json) as {
      version: number;
      chunks: Array<{ cx: number; cz: number; beltDir: number[]; beltSlots: number[] }>;
    };
    this.chunks.clear();
    for (const entry of data.chunks) {
      const chunk = new Chunk(entry.cx, entry.cz);
      chunk.beltDir.set(entry.beltDir.map((value) => value));
      chunk.beltSlots.set(entry.beltSlots.map((value) => value));
      chunk.dirtyStatic = true;
      chunk.dirtyItems = true;
      this.chunks.set(chunkKey(entry.cx, entry.cz), chunk);
    }
  }
}
