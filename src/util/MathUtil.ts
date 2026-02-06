/** Utility math helpers for grid directions, chunk keys, and slot offsets. */
import * as THREE from "three";

export const CHUNK_SIZE = 32;
export const TILE_SIZE = 1;
export const SLOTS_PER_BELT = 8;

export enum Dir {
  North = 0,
  East = 1,
  South = 2,
  West = 3,
}

export const DIR_OFFSETS: Record<Dir, { dx: number; dz: number }> = {
  [Dir.North]: { dx: 0, dz: -1 },
  [Dir.East]: { dx: 1, dz: 0 },
  [Dir.South]: { dx: 0, dz: 1 },
  [Dir.West]: { dx: -1, dz: 0 },
};

export function rotateDir(dir: Dir, delta: number): Dir {
  const value = (dir + delta + 4) % 4;
  return value as Dir;
}

export function dirToYaw(dir: Dir): number {
  switch (dir) {
    case Dir.North:
      return Math.PI;
    case Dir.East:
      return -Math.PI / 2;
    case Dir.South:
      return 0;
    case Dir.West:
      return Math.PI / 2;
    default:
      return 0;
  }
}

export function chunkKey(cx: number, cz: number): string {
  return `${cx},${cz}`;
}

export function slotOffset(slotIndex: number): number {
  return (slotIndex + 0.5) / SLOTS_PER_BELT - 0.5;
}

export function tempVec3(x: number, y: number, z: number, out?: THREE.Vector3): THREE.Vector3 {
  if (out) {
    out.set(x, y, z);
    return out;
  }
  return new THREE.Vector3(x, y, z);
}
