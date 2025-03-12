import dotenv from 'dotenv'
import path from 'path'
import { defineConfig } from 'vite'
import { version } from '../../package.json'
const envPath = path.dirname(path.dirname(__dirname))
dotenv.config({
  path: path.join(envPath, '.env'),
})
export default defineConfig({
  define: {
    global: {},
    __APP_VERSION__: JSON.stringify(version),
    __DEV_PORTAL_HOST__: JSON.stringify(process.env.ONE_INCH_DEV_PORTAL_HOST),
    __WALLET_CONNECT_PROJECT_ID__: JSON.stringify(process.env.WALLET_CONNECT_PROJECT_ID),
    __CLOUDFLARE_TURNSTILE_SITE_KEY__: JSON.stringify(process.env.CLOUDFLARE_TURNSTILE_SITE_KEY),
  },
  server: {
    port: 4201,
    host: '127.0.0.1',
  },
  preview: {
    port: 4300,
    host: '127.0.0.1',
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
  },
})
//# sourceMappingURL=vite.config.js.map
