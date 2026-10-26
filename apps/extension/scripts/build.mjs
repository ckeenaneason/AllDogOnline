/**
 * Builds the extension into the appropriate dist folder
 * The pages and service worker are normal ES module builds
 * Each content script is built separately as self-contained since content scripts
 * cannot load ES module chunks
 */
import { mkdirSync, readdirSync, readFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';

const watch = process.argv.includes('--watch');
const target = process.argv.find((a) => a.startsWith('--target='))?.slice('--target='.length) ?? 'chrome';
if (!['chrome', 'firefox'].includes(target)) throw new Error(`Unknown --target: ${target}`);

const root = fileURLToPath(new URL('..', import.meta.url)); //includes trailing '/'
const srcDir = `${root}src`;
const outDir = `${root}dist/${target}`;

// Emits manifest.json for the selected target browser. Chrome is the base file. Firefox must
// be modified since service workers are not supported.
function manifest() {
  const file = `${root}manifest.json`;
  return {
    name: 'ado-manifest',
    buildStart() {
      this.addWatchFile(file);
    },
    generateBundle() {
      const m = JSON.parse(readFileSync(file, 'utf8'));
      if (target === 'firefox') {
        m.background = { scripts: ['service.js'], type: 'module' };
        m.browser_specific_settings = {
          gecko: {
            id: 'alldogonline@extension',
            strict_min_version: '128.0', // content_scripts "world": "MAIN"
            data_collection_permissions: { required: ['none'] }
          }
        };
      }
      this.emitFile({ type: 'asset', fileName: 'manifest.json', source: JSON.stringify(m, null, 2) });
    }
  };
}

const sharedProps = {
  configFile: false,
  logLevel: 'info',
  build: {
    outDir,
    emptyOutDir: false,
    minify: !watch,
    sourcemap: watch ? 'inline' : false,
    watch: watch ? {} : null
  }
};

// Remove files in dist for rebuilt instead of deleting to account for Windows bind mount issues
mkdirSync(outDir, { recursive: true });
for (const entry of readdirSync(outDir)) {
  rmSync(`${outDir}/${entry}`, { recursive: true, force: true });
}

await build({
  ...sharedProps,
  publicDir: false,
  plugins: [manifest()],
  root: srcDir,
  build: {
    ...sharedProps.build,
    rollupOptions: {
      input: {
        popup: `${srcDir}/popup/index.html`,
        service: `${srcDir}/background/service.ts`
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});

for (const [name, entry] of [
  ['interceptor', 'inject/interceptor.ts'],
  ['tracker', 'content/tracker.ts']
]) {
  await build({
    ...sharedProps,
    publicDir: false,
    build: {
      ...sharedProps.build,
      lib: {
        entry: `${srcDir}/${entry}`,
        formats: ['iife'],
        name: `ado_${name}`,
        fileName: () => `${name}.js`
      }
    }
  });
}
