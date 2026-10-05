import { createApp } from 'vue'
import { createPinia } from 'pinia'
import 'leaflet/dist/leaflet.css'
import './styles.css'
import App from './App.vue'
import { router } from './router'
import { marksStore } from './lib/marks'

const theme = (() => { try { return localStorage.getItem('theme') } catch { return null } })()
if (theme) document.documentElement.dataset.theme = theme

createApp(App).use(createPinia()).use(router).mount('#app')
marksStore.init()
