import process from 'node:process';
import {defineConfig} from 'vite';

const ensureTrailingSlash = (url: string) =>
	url.endsWith('/') ? url : url + '/';

export default defineConfig(({command}) => ({
	base: ensureTrailingSlash(process.env.BASE_URL ?? '/'),
	cacheDir: 'node_modules/.cache/vite',
	esbuild: {
		minifyIdentifiers: command === 'build',
		keepNames: command !== 'build',
		treeShaking: true,
	},
	build: {
		target: ['firefox104', 'chrome104'],
		outDir: 'build',
		rollupOptions: {
			input: 'index.html',
		},
	},
}));
