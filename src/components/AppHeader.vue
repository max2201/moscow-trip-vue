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
      <h1>Москва, 14–22 октября</h1>
      <p class="lede">8 ночей в Москве для двоих, 14–22 октября. Жильё с разных площадок до 40&nbsp;000&nbsp;₽ за всё проживание, отзывы гостей, районы, что посмотреть, куда съездить и события на ваши даты.<template v-if="trip.index"> Всего прочитано <b>{{ fmt(trip.index.reviews) }} отзывов</b>.</template></p>
    </div>
    <div class="top-right"><span class="fw-badge">Vue 3</span><button class="theme" type="button" @click="toggleTheme">Тема</button></div>
  </div>
</template>
