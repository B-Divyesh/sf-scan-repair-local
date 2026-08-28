import { defineConfig } from 'vite'

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.7') },
  build: { target: 'es2022', sourcemap: false, manifest: 'asset-manifest.json', rollupOptions: { input: { main: 'index.html', demo: 'demo/index.html' } } },
  test: { environment: 'jsdom', exclude: ['tests/**', 'node_modules/**'] }
})
