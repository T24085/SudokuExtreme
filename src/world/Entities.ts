/** Entity definitions and item registry for belt slots. */

export const ITEM_NONE = 0;

export class ItemRegistry {
  private nextId = 1;
  private nameToId = new Map<string, number>();
  private idToName = new Map<number, string>();

  register(name: string): number {
    const existing = this.nameToId.get(name);
    if (existing) {
      return existing;
    }
    const id = this.nextId++;
    this.nameToId.set(name, id);
    this.idToName.set(id, name);
    return id;
  }

  getId(name: string): number {
    const id = this.nameToId.get(name);
    if (!id) {
      return this.register(name);
    }
    return id;
  }

  getName(id: number): string {
    return this.idToName.get(id) ?? "unknown";
  }
}

export const itemRegistry = new ItemRegistry();
itemRegistry.register("ore");
