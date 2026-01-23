export type ComponentRegistry = Record<string, any>;

const REGISTRY: ComponentRegistry = {};

export function register(manifest: { type: string; component: any }): void {
  if (!manifest?.type || !manifest.component) {
    return;
  }
  REGISTRY[manifest.type] = manifest.component;
}

export function getRegistry(): ComponentRegistry {
  return REGISTRY;
}
