import { createRouter, createWebHashHistory } from 'vue-router'
import StopView from './components/StopView.vue'

export const TABS = ['hotels', 'districts', 'sights', 'trips', 'events'] as const
export type Tab = (typeof TABS)[number]

export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', redirect: '/m1' },
    { path: '/:stop/:tab?', component: StopView, props: true },
  ],
  scrollBehavior: () => false,
})
