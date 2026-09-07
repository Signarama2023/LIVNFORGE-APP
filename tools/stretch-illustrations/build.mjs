import fs from "fs";
import { svg } from "./kit.mjs";
import { POSES } from "./poses.mjs";
const OUT = "./tools/stretch-illustrations/out";
fs.mkdirSync(OUT, { recursive: true });
const slugs = Object.keys(POSES);
let cells = "";
for (const slug of slugs) {
  const s = svg(POSES[slug]);
  fs.writeFileSync(`${OUT}/${slug}.svg`, s);
  cells += `<figure style="margin:0;background:#fff;border:1px solid #e5e2db;border-radius:14px;overflow:hidden;width:180px">
    <div style="width:100%">${s.replace('width="200" height="196" ', '').replace("<svg ", '<svg style="display:block;width:100%;height:170px" ')}</div>
    <figcaption style="padding:7px 10px;font-weight:600;font-size:13px">${slug}</figcaption></figure>\n`;
}
const html = `<!doctype html><html><head><meta charset=utf8><style>
body{background:#eceae5;font-family:system-ui;margin:0;padding:18px}
h1{font-size:15px}.grid{display:flex;gap:12px;flex-wrap:wrap}
</style></head><body><h1>All ${slugs.length} stretch illustrations</h1>
<div class="grid">${cells}</div></body></html>`;
fs.writeFileSync("./tools/stretch-illustrations/contact.html", html);
console.log("generated", slugs.length, "SVGs");
