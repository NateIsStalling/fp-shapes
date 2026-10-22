import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { languageExt } from "../src/catalog/languageext";

// The samples shown on the site must be the code that is compiled and checked
// in snippets/languageext/v4 (run it with `npm run samples:languageext`).

const source = readFileSync(resolve(import.meta.dirname, "../snippets/languageext/v4/Program.cs"), "utf8");
const compiled = new Map<string, string>();
for (const m of source.matchAll(/^([ \t]*)\/\/ <sample ([^>]+)>\n([\s\S]*?)^[ \t]*\/\/ <\/sample>/gm)) {
  const indent = m[1] as string;
  compiled.set(m[2] as string, (m[3] as string).split("\n").map((l) => (l.startsWith(indent) ? l.slice(indent.length) : l)).join("\n").replace(/\n$/, ""));
}
// Catalog keys may add a strategy ("traverse:either:eager"); markers use "op:receiver".
const markerFor = (key: string) => key.split(":").slice(0, 2).join(":");

describe("LanguageExt samples", () => {
  it("every catalog sample is verbatim from the compiled file", () => {
    for (const [key, entry] of Object.entries(languageExt)) {
      expect(compiled.get(markerFor(key)), key).toBe(entry.sample);
    }
  });
  it("every compiled sample is in the catalog", () => {
    const shown = new Set(Object.keys(languageExt).map(markerFor));
    for (const marker of compiled.keys()) expect(shown, marker).toContain(marker);
  });
});
