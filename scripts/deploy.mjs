import fs from "node:fs";
import path from "node:path";

// Токен: переменная окружения или локальный конфиг CLI (в git не попадает).
const TOKEN = process.env.VERCEL_TOKEN ?? JSON.parse(fs.readFileSync(".vercel-cli/auth.json", "utf8")).token;
const TEAM = "team_r0ZuEXB6A6fjKxu0WSB9spR2";
const H = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" };

const api = async (p, init = {}) => {
  const res = await fetch(`https://api.vercel.com${p}`, { ...init, headers: { ...H, ...(init.headers || {}) } });
  const text = await res.text();
  let body; try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
};

// 1. проект
let project = (await api(`/v9/projects?teamId=${TEAM}&search=triis`)).body?.projects?.find((p) => p.name === "triis");
if (!project) {
  const r = await api(`/v11/projects?teamId=${TEAM}`, {
    method: "POST",
    body: JSON.stringify({ name: "triis", framework: null, publicSource: false }),
  });
  console.log("project:", r.status, r.body?.id ?? r.body);
  if (r.status >= 400) process.exit(1);
  project = r.body;
} else {
  console.log("project exists:", project.id);
}

// 2. файлы сборки
const distDir = "dist";
const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else files.push({ file: path.relative(distDir, full).split(path.sep).join("/"), data: fs.readFileSync(full).toString("base64") });
  }
};
walk(distDir);
console.log("files:", files.map((f) => f.file).join(", "));

// 3. деплой
const dep = await api(`/v13/deployments?teamId=${TEAM}&forceNew=1`, {
  method: "POST",
  body: JSON.stringify({
    name: "triis",
    project: project.id,
    target: "production",
    files: files.map((f) => ({ file: f.file, data: f.data, encoding: "base64" })),
    projectSettings: {
      framework: null,
      buildCommand: null,
      outputDirectory: null,
      installCommand: null,
      devCommand: null,
    },
  }),
});
console.log("deploy:", dep.status, JSON.stringify(dep.body).slice(0, 500));
if (dep.status >= 400) process.exit(1);

const id = dep.body.id;
for (let i = 0; i < 40; i += 1) {
  await new Promise((r) => setTimeout(r, 3000));
  const s = await api(`/v13/deployments/${id}?teamId=${TEAM}`);
  const state = s.body?.readyState ?? s.body?.status;
  console.log("state:", state);
  if (state === "READY" || state === "ERROR" || state === "CANCELED") {
    console.log("url:", s.body?.url, "| aliases:", JSON.stringify(s.body?.alias));
    break;
  }
}
