/** 无第三方依赖的语法、静态资源、文档链接与目录检查。 */
import { readdir, readFile, access } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const failures = [];
async function files(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if ([".git", "node_modules", "output"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    result.push(...(entry.isDirectory() ? await files(full) : [full]));
  }
  return result;
}
async function reference(file, target) {
  if (
    !target ||
    target.startsWith("#") ||
    /^(?:https?:|mailto:|data:|codex:)/i.test(target)
  )
    return;
  const clean = decodeURIComponent(
    target
      .replace(/^<|>$/g, "")
      .split("#")[0]
      .split("?")[0]
      .replace(/:\d+$/, ""),
  );
  if (!clean) return;
  try {
    await access(path.resolve(path.dirname(file), clean));
  } catch {
    failures.push(`${path.relative(root, file)} → ${target}`);
  }
}
let syntax = 0,
  links = 0;
for (const file of await files(root)) {
  if (file.endsWith(".mjs")) {
    const result = spawnSync(process.execPath, ["--check", file], {
      encoding: "utf8",
    });
    if (result.status !== 0) failures.push(result.stderr.trim());
    syntax++;
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/\bfrom\s+['"](\.[^'"]+)['"]/g)) {
      await reference(file, match[1]);
      links++;
    }
  } else if (file.endsWith(".md")) {
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/\]\(([^)]+)\)/g)) {
      await reference(file, match[1]);
      links++;
    }
  } else if (file.endsWith(".css")) {
    const text = await readFile(file, "utf8");
    for (const match of text.matchAll(/url\(\s*['"]?([^'"\s)]+)['"]?\s*\)/g)) {
      await reference(file, match[1]);
      links++;
    }
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else
  console.log(`检查通过：${syntax}个JS模块，${links}处模块/文档/样式引用。`);
