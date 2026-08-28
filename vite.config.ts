import { defineConfig } from 'vite'

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.1') },
  build: { target: 'es2022', sourcemap: false, manifest: 'asset-manifest.json' },
  test: { environment: 'jsdom', exclude: ['tests/**', 'node_modules/**'] }
})
