import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const repoBase = "/Motor-Insurance/";

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === "build" ? repoBase : "/",
}));
