/** Instanced rendering batches per chunk for ground, belts, and items. */
import * as THREE from "three";
import { Chunk } from "../world/Chunk";
import { CHUNK_SIZE, Dir, SLOTS_PER_BELT, dirToYaw, slotOffset } from "../util/MathUtil";
import { ITEM_NONE } from "../world/Entities";

const TILE_COUNT = CHUNK_SIZE * CHUNK_SIZE;

type ChunkRenderData = {
  ground: THREE.InstancedMesh;
  belts: THREE.InstancedMesh;
  items: THREE.InstancedMesh;
};

export class InstancedBatches {
  private scene: THREE.Scene;
  private root = new THREE.Group();
  private chunkMeshes = new Map<string, ChunkRenderData>();
  private tempObject = new THREE.Object3D();

  private groundGeometry = new THREE.BoxGeometry(1, 0.05, 1);
  private groundMaterial = new THREE.MeshStandardMaterial({ color: 0x2b2b2b });
  private beltGeometry = new THREE.BoxGeometry(1, 0.2, 1);
  private beltMaterial = new THREE.MeshStandardMaterial({ color: 0x5555aa });
  private itemGeometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  private itemMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa33 });

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.scene.add(this.root);
  }

  ensureChunk(chunk: Chunk): ChunkRenderData {
    const key = `${chunk.cx},${chunk.cz}`;
    let data = this.chunkMeshes.get(key);
    if (data) {
      return data;
    }

    const ground = new THREE.InstancedMesh(this.groundGeometry, this.groundMaterial, TILE_COUNT);
    ground.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const belts = new THREE.InstancedMesh(this.beltGeometry, this.beltMaterial, TILE_COUNT);
    belts.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    const items = new THREE.InstancedMesh(this.itemGeometry, this.itemMaterial, TILE_COUNT * SLOTS_PER_BELT);
    items.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

    this.root.add(ground, belts, items);

    this.populateGround(chunk, ground);

    data = { ground, belts, items };
    this.chunkMeshes.set(key, data);
    return data;
  }

  populateGround(chunk: Chunk, ground: THREE.InstancedMesh): void {
    let instanceId = 0;
    for (let lz = 0; lz < CHUNK_SIZE; lz += 1) {
      for (let lx = 0; lx < CHUNK_SIZE; lx += 1) {
        const worldX = chunk.cx * CHUNK_SIZE + lx + 0.5;
        const worldZ = chunk.cz * CHUNK_SIZE + lz + 0.5;
        this.tempObject.position.set(worldX, -0.03, worldZ);
        this.tempObject.rotation.set(0, 0, 0);
        this.tempObject.updateMatrix();
        ground.setMatrixAt(instanceId, this.tempObject.matrix);
        instanceId += 1;
      }
    }
    ground.instanceMatrix.needsUpdate = true;
  }

  syncChunk(chunk: Chunk): void {
    const data = this.ensureChunk(chunk);
    if (chunk.dirtyStatic) {
      this.updateBelts(chunk, data.belts);
      chunk.dirtyStatic = false;
    }
    if (chunk.dirtyItems) {
      this.updateItems(chunk, data.items);
      chunk.dirtyItems = false;
    }
  }

  updateBelts(chunk: Chunk, mesh: THREE.InstancedMesh): void {
    let count = 0;
    for (let index = 0; index < chunk.beltDir.length; index += 1) {
      const dir = chunk.beltDir[index];
      if (dir < 0) {
        continue;
      }
      const lx = index % CHUNK_SIZE;
      const lz = Math.floor(index / CHUNK_SIZE);
      const worldX = chunk.cx * CHUNK_SIZE + lx + 0.5;
      const worldZ = chunk.cz * CHUNK_SIZE + lz + 0.5;
      this.tempObject.position.set(worldX, 0.1, worldZ);
      this.tempObject.rotation.set(0, dirToYaw(dir as Dir), 0);
      this.tempObject.updateMatrix();
      mesh.setMatrixAt(count, this.tempObject.matrix);
      count += 1;
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
  }

  updateItems(chunk: Chunk, mesh: THREE.InstancedMesh): void {
    let count = 0;
    for (let index = 0; index < chunk.beltDir.length; index += 1) {
      const dir = chunk.beltDir[index];
      if (dir < 0) {
        continue;
      }
      const lx = index % CHUNK_SIZE;
      const lz = Math.floor(index / CHUNK_SIZE);
      const baseX = chunk.cx * CHUNK_SIZE + lx + 0.5;
      const baseZ = chunk.cz * CHUNK_SIZE + lz + 0.5;
      const baseSlot = index * SLOTS_PER_BELT;
      for (let slot = 0; slot < SLOTS_PER_BELT; slot += 1) {
        const itemId = chunk.beltSlots[baseSlot + slot];
        if (itemId === ITEM_NONE) {
          continue;
        }
        const offset = slotOffset(slot);
        let offsetX = 0;
        let offsetZ = 0;
        switch (dir as Dir) {
          case Dir.North:
            offsetZ = -offset;
            break;
          case Dir.South:
            offsetZ = offset;
            break;
          case Dir.East:
            offsetX = offset;
            break;
          case Dir.West:
            offsetX = -offset;
            break;
          default:
            break;
        }
        this.tempObject.position.set(baseX + offsetX, 0.25, baseZ + offsetZ);
        this.tempObject.rotation.set(0, 0, 0);
        this.tempObject.updateMatrix();
        mesh.setMatrixAt(count, this.tempObject.matrix);
        count += 1;
      }
    }
    mesh.count = count;
    mesh.instanceMatrix.needsUpdate = true;
  }
}
