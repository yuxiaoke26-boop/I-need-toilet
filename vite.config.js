import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 发现新版本自动更新
      // 根据你截图里的 public 文件夹，把需要缓存的静态资源放进来
      includeAssets: ['favicon.svg', 'icons.svg', 'image1.png'], 
      manifest: {
        name: 'Toilet Diary',
        short_name: 'Toilet',
        description: 'A bathroom rating and logging application.',
        theme_color: '#ffffff',
        icons: [
          {
            src: '192x192.png', 
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '512x512.png', 
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})