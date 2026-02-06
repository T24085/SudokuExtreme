/** Main game loop with fixed tick accumulator and chunk sync. */
import * as RE from "rogue-engine";
import * as THREE from "three";
import { World } from "../world/World";
import { Simulator } from "../sim/Simulator";
import { InstancedBatches } from "../render/InstancedBatches";
import { InputController } from "../input/InputController";

export default class GameManager extends RE.Component {
  private world = new World();
  private simulator = new Simulator();
  private renderer?: InstancedBatches;
  private input?: InputController;
  private accumulator = 0;
  private readonly tickRate = 1 / 20;
  private camera?: THREE.PerspectiveCamera;

  awake(): void {
    const scene = RE.Runtime.scene as THREE.Scene;
    scene.background = new THREE.Color(0x111218);
    const light = new THREE.DirectionalLight(0xffffff, 1.1);
    light.position.set(10, 20, 10);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0xffffff, 0.4));

    this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    scene.add(this.camera);

    this.renderer = new InstancedBatches(scene);
    this.input = new InputController(this.camera, document.body, this.world, scene);
  }

  update(): void {
    if (!this.renderer || !this.input || !this.camera) {
      return;
    }
    const delta = RE.Runtime.deltaTime ?? 0;
    this.input.update(delta);
    this.accumulator += delta;

    const activeChunks = this.world.getActiveChunks(this.input.getCameraTarget(), 3);
    while (this.accumulator >= this.tickRate) {
      this.simulator.tick(this.world, activeChunks);
      this.accumulator -= this.tickRate;
    }

    for (const chunk of activeChunks) {
      this.renderer.syncChunk(chunk);
    }
  }
}
