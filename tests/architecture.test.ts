import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { describe, expect, it } from "vitest";

// Layer boundaries: semantics -> scenes -> ui. The catalog and search sit
// beside them. A violation fails the test suite, and with it CI.

const src = resolve(import.meta.dirname, "../src");

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(path);
    return /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
}

function imports(path: string): string[] {
  const text = readFileSync(path, "utf8");
  return [...text.matchAll(/(?:import|export)[^"']*?from\s*["']([^"']+)["']/g)].map((m) => m[1] as string);
}

// For each layer: which top-level src folders it may import from.
const allowed: Record<string, readonly string[]> = {
  semantics: ["semantics"],
  scenes: ["scenes", "semantics"],
  catalog: ["catalog", "semantics"],
  search: ["search", "catalog", "semantics"],
  ui: ["ui", "scenes", "catalog", "search", "semantics"],
};

const pureLayers = new Set(["semantics", "scenes", "catalog", "search"]);

describe("layer boundaries", () => {
  for (const layer of Object.keys(allowed)) {
    const dir = join(src, layer);
    let layerFiles: string[] = [];
    try {
      layerFiles = files(dir);
    } catch {
      continue;
    }
    for (const file of layerFiles) {
      it(`${relative(src, file)} imports only what ${layer} may use`, () => {
        for (const spec of imports(file)) {
          if (spec.startsWith(".")) {
            const target = relative(src, resolve(file, "..", spec)).split(/[\\/]/)[0] as string;
            expect(allowed[layer], `${spec} reaches into ${target}`).toContain(target);
          } else if (pureLayers.has(layer)) {
            // Pure layers may use the test toolkit in tests, nothing else from npm.
            const isTest = /\.test\.tsx?$/.test(file);
            expect(isTest && ["vitest", "fast-check"].includes(spec), `${layer} must not import "${spec}"`).toBe(true);
          }
        }
      });
    }
  }
});
