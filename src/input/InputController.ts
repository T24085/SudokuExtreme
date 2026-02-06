/** Camera input, raycast placement, and hotkey handling. */
import * as THREE from "three";
import { World } from "../world/World";
import { Dir, dirToYaw, rotateDir } from "../util/MathUtil";

export type InputState = {
  hoveredTile?: { tx: number; tz: number };
  buildDir: Dir;
};

export class InputController {
  private camera: THREE.PerspectiveCamera;
  private domElement: HTMLElement;
  private world: World;
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  private intersection = new THREE.Vector3();

  private target = new THREE.Vector3(0, 0, 0);
  private zoom = 18;
  private moveSpeed = 10;

  private pressed = new Set<string>();
  private leftClick = false;
  private rightClick = false;
  private middleDown = false;
  private lastMouse = new THREE.Vector2();

  private ghost: THREE.Mesh;
  readonly state: InputState = { buildDir: Dir.East };

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement, world: World, scene: THREE.Scene) {
    this.camera = camera;
    this.domElement = domElement;
    this.world = world;

    this.ghost = new THREE.Mesh(
      new THREE.BoxGeometry(1, 0.2, 1),
      new THREE.MeshStandardMaterial({ color: 0x33ff99, transparent: true, opacity: 0.5 })
    );
    this.ghost.visible = false;
    scene.add(this.ghost);

    this.bindEvents();
    this.updateCamera();
  }

  private bindEvents(): void {
    window.addEventListener("keydown", (event) => {
      this.pressed.add(event.key.toLowerCase());
      if (event.key === "q") {
        this.state.buildDir = rotateDir(this.state.buildDir, -1);
      }
      if (event.key === "e") {
        this.state.buildDir = rotateDir(this.state.buildDir, 1);
      }
      if (event.key === "1") {
        this.injectItem();
      }
      if (event.key === "F5") {
        event.preventDefault();
        this.save();
      }
      if (event.key === "F9") {
        event.preventDefault();
        this.load();
      }
    });

    window.addEventListener("keyup", (event) => {
      this.pressed.delete(event.key.toLowerCase());
    });

    this.domElement.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.leftClick = true;
      }
      if (event.button === 2) {
        this.rightClick = true;
      }
      if (event.button === 1) {
        this.middleDown = true;
      }
      this.lastMouse.set(event.clientX, event.clientY);
    });

    this.domElement.addEventListener("mouseup", (event) => {
      if (event.button === 1) {
        this.middleDown = false;
      }
    });

    this.domElement.addEventListener("contextmenu", (event) => event.preventDefault());

    this.domElement.addEventListener("mousemove", (event) => {
      if (this.middleDown) {
        const dx = event.clientX - this.lastMouse.x;
        const dy = event.clientY - this.lastMouse.y;
        this.target.x -= dx * 0.02;
        this.target.z -= dy * 0.02;
        this.lastMouse.set(event.clientX, event.clientY);
        this.updateCamera();
      }
      const rect = this.domElement.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    });

    this.domElement.addEventListener("wheel", (event) => {
      this.zoom += event.deltaY * 0.01;
      this.zoom = THREE.MathUtils.clamp(this.zoom, 6, 40);
      this.updateCamera();
    });
  }

  update(delta: number): void {
    const move = this.moveSpeed * delta;
    if (this.pressed.has("w")) {
      this.target.z -= move;
    }
    if (this.pressed.has("s")) {
      this.target.z += move;
    }
    if (this.pressed.has("a")) {
      this.target.x -= move;
    }
    if (this.pressed.has("d")) {
      this.target.x += move;
    }
    this.updateCamera();
    this.updateHover();
    this.handleClicks();
  }

  getCameraTarget(): THREE.Vector3 {
    return this.target;
  }

  private updateCamera(): void {
    this.camera.position.set(this.target.x, this.zoom, this.target.z + this.zoom);
    this.camera.lookAt(this.target.x, 0, this.target.z);
  }

  private updateHover(): void {
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const hit = this.raycaster.ray.intersectPlane(this.plane, this.intersection);
    if (!hit) {
      this.ghost.visible = false;
      this.state.hoveredTile = undefined;
      return;
    }
    const { tx, tz } = this.world.worldToTile(this.intersection);
    this.state.hoveredTile = { tx, tz };
    const worldPos = this.world.tileToWorld(tx, tz);
    this.ghost.position.set(worldPos.x, 0.15, worldPos.z);
    this.ghost.rotation.set(0, dirToYaw(this.state.buildDir), 0);
    this.ghost.visible = true;
  }

  private handleClicks(): void {
    if (!this.state.hoveredTile) {
      this.leftClick = false;
      this.rightClick = false;
      return;
    }
    const { tx, tz } = this.state.hoveredTile;
    if (this.leftClick) {
      this.world.placeBelt(tx, tz, this.state.buildDir);
    }
    if (this.rightClick) {
      this.world.removeEntity(tx, tz);
    }
    this.leftClick = false;
    this.rightClick = false;
  }

  private injectItem(): void {
    if (!this.state.hoveredTile) {
      return;
    }
    this.world.injectItem(this.state.hoveredTile.tx, this.state.hoveredTile.tz, "ore");
  }

  private save(): void {
    const json = this.world.serializeChunks(Array.from(this.world.chunks.values()));
    window.localStorage.setItem("factory-save", json);
  }

  private load(): void {
    const json = window.localStorage.getItem("factory-save");
    if (!json) {
      return;
    }
    this.world.loadFromJSON(json);
  }
}
