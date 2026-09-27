import { createApp } from 'vue'
import App from './App.vue'
import './style.css'
import { syncAssetsIfEmpty } from './store'

createApp(App).mount('#app')

// 本地资产为空时，从 assets.json 补齐默认资产
syncAssetsIfEmpty()

// 注册 Service Worker（离线可用）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const url = `${import.meta.env.BASE_URL}sw.js`
    navigator.serviceWorker.register(url).catch(err => {
      console.warn('Service Worker 注册失败：', err)
    })
  })
}
