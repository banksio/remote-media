const { resolve } = require("path")

/**
 * @type {import('vite').UserConfig}
 */
const config = {
    base: "/",
    server: {
        proxy: {
            "/": {
                target: "http://localhost:3694",
                ws: true
            },
        }
    },
    build: {
        rollupOptions: {
          input: {
            main: resolve(__dirname, "index.html"),
            admin: resolve(__dirname, "admin/index.html")
          }
        }
      }
};

export default config;
