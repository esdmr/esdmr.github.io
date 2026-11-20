import process from "node:process";

import { defineConfig } from "vite";

const ensureTrailingSlash = (url: string) =>
	url.endsWith("/") ? url : url + "/";

export default defineConfig({
	base: ensureTrailingSlash(process.env.BASE_URL ?? "/"),
	cacheDir: "node_modules/.cache/vite",
	build: {
		minify: "esbuild",
		target: ["firefox104", "chrome104"],
		outDir: "build"
	},
});
