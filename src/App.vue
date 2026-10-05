<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useTrip } from './stores/trip'
import { useMarks } from './composables/useMarks'
import AppHeader from './components/AppHeader.vue'
import NameBar from './components/NameBar.vue'
import RouteRibbon from './components/RouteRibbon.vue'
import WhoDialog from './components/WhoDialog.vue'
import MethodNotes from './components/MethodNotes.vue'

const trip = useTrip()
const { store, version } = useMarks()
const whoOpen = ref(false)
onMounted(() => trip.init())
// Спрашиваем имя, как только база ответила, — один раз за визит.
let asked = false
watch(version, () => {
  if (!asked && store.mode === 'shared' && store.needName) { asked = true; whoOpen.value = true }
})
</script>

<template>
  <div class="wrap">
    <AppHeader />
    <div v-if="trip.error" class="err">Не удалось загрузить данные: {{ trip.error }}</div>
    <template v-else-if="trip.index">
      <NameBar @who="whoOpen = true" />
      <RouteRibbon />
      <RouterView :key="$route.params.stop as string" />
      <MethodNotes />
    </template>
    <div v-else class="loading">Загружаю маршрут…</div>
  </div>
  <WhoDialog v-if="whoOpen" @close="whoOpen = false" />
</template>
