import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),

  ],
  build: {
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]'
      }
    }
    // rollupOptions: {
    //   output: {
    //     assetFileNames: 'ui/assets/[name].[hash][extname]',
    //     chunkFileNames: 'ui/assets/[name].[hash].js',
    //     entryFileNames: 'ui/assets/[name].[hash].js',
    //   },
    // },
  },
})