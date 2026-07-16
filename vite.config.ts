import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  // Backend CORS faqat https://falaqnashr.uz'ga ruxsat beradi, shuning uchun
  // dev'da so'rovlar Vite orqali proksilanadi (brauzer uchun same-origin).
  server: {
    proxy: {
      '/api': {
        target: 'https://api.falaqnashr.uz',
        changeOrigin: true,
      },
    },
  },
})
