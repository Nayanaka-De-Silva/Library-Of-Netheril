import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { createTestContext } from "../helpers/test-context";

const createClientDist = async () => {
  const clientDistPath = await fs.mkdtemp(path.join(os.tmpdir(), "library-of-netheril-client-"));

  await fs.mkdir(path.join(clientDistPath, "assets"), { recursive: true });
  await fs.writeFile(
    path.join(clientDistPath, "index.html"),
    "<!doctype html><html><head><link rel=\"stylesheet\" href=\"/assets/app.css\"></head><body><div id=\"root\"></div><script type=\"module\" src=\"/assets/app.js\"></script></body></html>",
  );
  await fs.writeFile(path.join(clientDistPath, "assets", "app.js"), "console.log('netheril');");
  await fs.writeFile(path.join(clientDistPath, "assets", "app.css"), "body { background: #000; }");

  return clientDistPath;
};

describe("static frontend serving", () => {
  it("serves the SPA shell and asset files with browser-safe MIME types", async () => {
    const clientDistPath = await createClientDist();

    try {
      const { app } = await createTestContext({ clientDistPath });

      const indexResponse = await app.request("/");
      expect(indexResponse.status).toBe(200);
      expect(indexResponse.headers.get("content-type")).toBe("text/html; charset=utf-8");
      expect(await indexResponse.text()).toContain('script type="module" src="/assets/app.js"');

      const scriptResponse = await app.request("/assets/app.js");
      expect(scriptResponse.status).toBe(200);
      expect(scriptResponse.headers.get("content-type")).toBe("text/javascript; charset=utf-8");
      expect(await scriptResponse.text()).toContain("console.log('netheril');");

      const stylesheetResponse = await app.request("/assets/app.css");
      expect(stylesheetResponse.status).toBe(200);
      expect(stylesheetResponse.headers.get("content-type")).toBe("text/css; charset=utf-8");
    } finally {
      await fs.rm(clientDistPath, { recursive: true, force: true });
    }
  });
});
