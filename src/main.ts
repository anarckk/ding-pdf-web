import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';

const app = createApp(App)

app.use(Antd).use(router)
app.config.globalProperties.serverId = "a9536e05-e384-4c94-89f2-9f28abda5db8";
app.mount('#app')
