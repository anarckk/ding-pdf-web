import { createRouter } from 'vue-router'
import { createWebHashHistory } from 'vue-router'
import ClientView from "@/views/ClientView.vue";
import ServerView from "@/views/ServerView.vue";

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'client',
      component: ClientView
    },
    {
      path: '/server',
      name: 'server',
      component: ServerView
    }
  ]
})

export default router
