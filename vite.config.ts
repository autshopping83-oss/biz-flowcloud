import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
  ],
  
  build: {
    chunkSizeWarningLimit: 1000,
    
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-pdf': ['jspdf', 'html2canvas'],
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    
    minify: 'esbuild',
    
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: true,
  },
  
  esbuild: {
    treeShaking: true,
    legalComments: 'none',
  },
  
  server: {
    port: 5173,
    strictPort: true,
  },
  
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@services': '/src/services',
      '@pages': '/src/pages',
    },
  },
});
