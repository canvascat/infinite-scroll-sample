import { createApp } from 'vue'
import App from './App.vue'
import { fetchData } from './helpers'

createApp(App).mount('#app')

console.log(fetchData(2))