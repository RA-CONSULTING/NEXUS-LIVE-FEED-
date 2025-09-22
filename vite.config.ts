const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');
const tsconfigPaths = require('vite-tsconfig-paths').default;

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [react(), tsconfigPaths()],
  server: {
    proxy: {
      '/stream': 'http://localhost:3000',
      '/api': 'http://localhost:3000',
    }
  }
});
