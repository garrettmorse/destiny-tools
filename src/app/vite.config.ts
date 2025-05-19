import {
  defineConfig
} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  console.log(mode);
  return {
    base: process.env.NODE_ENV === 'development' ? "" : "/raidlytics",
    server: {
      port: process.env.NODE_ENV === 'development' ? 5173 : 8080
    },
    define: process.env.NODE_ENV === 'development' ? { global: { BNET: 'https://bungie.net', SERVICE_URL: 'http://localhost:8080', BASE_PATH: '' } } : { global: { BNET: 'https://bungie.net', SERVICE_URL: '', BASE_PATH: '/raidlytics' }},
    plugins: [react(), tailwindcss()],
  }
})