<script setup lang="ts">
import { useTrip } from '../stores/trip'
import { fmt } from '../lib/format'
const trip = useTrip()
function toggleTheme() {
  const root = document.documentElement
  const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme:dark)').matches
  root.dataset.theme = dark ? 'light' : 'dark'
  try { localStorage.setItem('theme', root.dataset.theme) } catch { /* ignore */ }
}
</script>
<template>
  <div class="top">
    <div>
      <h1>Таиланд, 6–26 декабря</h1>
      <p class="lede">Маршрут из вашего плана: 7 остановок, 20 ночей. Для каждой — все отели города до 5&nbsp;000&nbsp;₽ за ночь на ваши даты (в Чиангмае — до 7&nbsp;000&nbsp;₽), разбор отзывов, районы, что посмотреть, куда съездить за 2 часа и что будет происходить в эти дни.<template v-if="trip.index"> Всего прочитано <b>{{ fmt(trip.index.reviews) }} отзывов</b>.</template></p>
    </div>
    <div class="top-right"><span class="fw-badge">Vue 3</span><button class="theme" type="button" @click="toggleTheme">Тема</button></div>
  </div>
</template>
