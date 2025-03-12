import dotenv from 'dotenv'
import path from 'path'
import { defineConfig, UserConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import preload from 'vite-plugin-preload'
import { version } from '../../package.json'
import vitePwaConfig from "./vite-pwa.config";
import * as process from "node:process";

const envPath = path.dirname(path.dirname(__dirname))
dotenv.config({
  path: path.join(envPath, '.env'),
})

export default defineConfig(({ mode }) => {

  const isProduction = process.env['DAPP_IS_PRODUCTION']
      ? Boolean(process.env['DAPP_IS_PRODUCTION'])
      : mode === 'production'

  // const electronBundle = process.env['ELECTRON_BUNDLE'] === 'true'
  const electronBundle = true
  const outDir = electronBundle
      ? path.join(path.dirname(__dirname), 'electron-dapp', 'out', 'render')
      : path.join('dist', 'dapp')

  const baseHref = process.env['BASE_HREF'] ?? electronBundle ? './' : '/'
  const baseVite = process.env['BASE_VITE'] ?? electronBundle ? './' : '/'

  console.log('mode is ', isProduction ? 'production' : 'development')
  console.log('dApp version ', version)
  console.log('baseHref', baseHref)
  console.log('baseVite', baseVite)
  if (electronBundle) {
    console.log('Build Electron bundle')
  }

  return {
    appType: 'spa',
    base: baseVite,
    root: __dirname,
    cacheDir: isProduction ? undefined : 'cache/vite' + outDir,

    define: {
      global: {},
      __APP_VERSION__: JSON.stringify(version),
      __DEV_PORTAL_HOST__: JSON.stringify(process.env.ONE_INCH_DEV_PORTAL_HOST),
      __WALLET_CONNECT_PROJECT_ID__: JSON.stringify(process.env.WALLET_CONNECT_PROJECT_ID),
      __CLOUDFLARE_TURNSTILE_SITE_KEY__: JSON.stringify(process.env.CLOUDFLARE_TURNSTILE_SITE_KEY),
    },

    server: {
      port: 4200,
      host: '0.0.0.0',
    },

    preview: {
      port: 4300,
      host: '0.0.0.0',
    },

    optimizeDeps: {
      include: ['tslib'],
      force: true,
    },

    plugins: [
      electronBundle ? undefined : VitePWA(vitePwaConfig(baseHref, isProduction)),
      electronBundle ? undefined : preload({mode: 'prefetch'}),
    ].filter(Boolean),

    build: {
      outDir: outDir,
      chunkSizeWarningLimit: 700,
      reportCompressedSize: true,
      sourcemap: true,
      terserOptions: {
        format: {
          comments: false,
        },
        compress: isProduction,
      },
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, electronBundle ? 'index.electron.html' : 'index.html'),
        },
      },
    },
    esbuild: { legalComments: 'none' },
  } satisfies UserConfig
})
