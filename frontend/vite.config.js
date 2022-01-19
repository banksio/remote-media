const { resolve } = require('path')

/**
 * @type {import('vite').UserConfig}
 */
const config = {
    base: "/dist/",
    server: {
        proxy: {
            '/api': 'http://localhost:3694',
            '/socket.io': {
                target: 'http://localhost:3694',
                ws: false
            },
        }
    },
    build: {
        rollupOptions: {
          input: {
            main: resolve(__dirname, 'index.html'),
            admin: resolve(__dirname, 'admin/index.html')
          }
        }
      }
};

export default config;
