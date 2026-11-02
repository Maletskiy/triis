import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** Время сборки и коммит — попадают в подвал как «последнее обновление». */
function buildStamp() {
  let commit = "local";
  try {
    commit = execSync("git rev-parse --short HEAD", { encoding: "utf8" }).trim();
  } catch {
    commit = "local";
  }
  return { time: new Date().toISOString(), commit };
}

const stamp = buildStamp();

export default defineConfig({
  plugins: [react()],
  define: {
    __BUILD_TIME__: JSON.stringify(stamp.time),
    __BUILD_COMMIT__: JSON.stringify(stamp.commit),
  },
});
