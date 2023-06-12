import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill'
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill'
import inject from '@rollup/plugin-inject'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    rollupOptions: {
      plugins: [inject({ Buffer: ['buffer', 'Buffer'] })]
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis' // fix nuxt3 global
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true, // fix nuxt3 process
          buffer: true
        }),
        NodeModulesPolyfillPlugin()
      ]
    }
  }
})
