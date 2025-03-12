import { bootstrapApplication } from '@1inch-community/integration-layer/application'
bootstrapApplication(() => import('./app.element'), {
  oneInchDevPortalHost: __DEV_PORTAL_HOST__,
  walletConnectProjectId: __WALLET_CONNECT_PROJECT_ID__,
  appVersion: __APP_VERSION__,
  cloudflareTurnstileSiteKey: __CLOUDFLARE_TURNSTILE_SITE_KEY__,
}).catch(console.error)
// import('virtual:pwa-register').then(({ registerSW }) => {
//   registerSW({
//     onRegisteredSW: async (_, worker: ServiceWorkerRegistration) => {
//       console.log('worker updated')
//       await worker.update()
//     },
//     onNeedRefresh: () => console.log('update ready'),
//     onOfflineReady: () => console.log('offline ready'),
//   })
// })
//# sourceMappingURL=main.js.map
