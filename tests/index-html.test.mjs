import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("離線版具備可執行的比較程式與必要功能", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  const script = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];

  assert.ok(script, "找不到離線版 JavaScript");
  assert.doesNotThrow(() => new Function(script));
  assert.match(html, /id="fileA"\s+type="file"/);
  assert.match(html, /permitted-ip/);
  assert.match(html, /xlsx\.full\.min\.js/);
});
