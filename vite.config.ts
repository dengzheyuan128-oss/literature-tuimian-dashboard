import { jsxLocPlugin } from "@builder.io/vite-plugin-jsx-loc";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "path";
import { defineConfig } from "vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import { execSync } from "child_process";

// 获取build commit和build time
function getBuildInfo() {
  try {
    // 优先使用Vercel环境变量
    if (process.env.VERCEL_GIT_COMMIT_SHA) {
      return {
        commit: process.env.VERCEL_GIT_COMMIT_SHA.substring(0, 7),
        time: new Date().toISOString(),
      };
    }
    // 本地开发环境使用git命令
    const commit = execSync("git rev-parse --short HEAD").toString().trim();
    return {
      commit,
      time: new Date().toISOString(),
    };
  } catch (error) {
    return {
      commit: "unknown",
      time: new Date().toISOString(),
    };
  }
}

const buildInfo = getBuildInfo();

const plugins = [react(), tailwindcss(), jsxLocPlugin(), vitePluginManusRuntime()];

export default defineConfig({
  define: {
    __BUILD_COMMIT__: JSON.stringify(buildInfo.commit),
    __BUILD_TIME__: JSON.stringify(buildInfo.time),
  },
  plugins,
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port: 3000,
    strictPort: false, // Will find next available port if 3000 is busy
    host: true,
    allowedHosts: [
      ".manuspre.computer",
      ".manus.computer",
      ".manus-asia.computer",
      ".manuscomputer.ai",
      ".manusvm.computer",
      "localhost",
      "127.0.0.1",
    ],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
