<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Guide, Stop, StopRows } from '../lib/types'
import type { Filters } from '../lib/filters'
import { applyFilters, encodeFilters } from '../lib/filters'
import { useMarks } from '../composables/useMarks'
import FiltersPanel from './FiltersPanel.vue'
import HotelsTable from './HotelsTable.vue'
import HotelCard from './HotelCard.vue'
import HotelMap from './HotelMap.vue'

const props = defineProps<{ stop: Stop; data: StopRows; guide: Guide; filters: Filters }>()
const { store, version } = useMarks()
const route = useRoute()
const router = useRouter()

const marksView = computed(() => {
  version.value // зависимость: пересчитать при изменении отметок
  return { mine: (id: number) => store.mine(props.stop.id, id), anyPlus: (id: number) => store.anyPlus(props.stop.id, id) }
})
const list = computed(() => applyFilters(props.data.rows, props.filters, marksView.value))
const visible = computed(() => new Set(list.value.map((r) => r.id)))

// Таблица на широком экране, карточки — на телефоне. Выбор запоминается.
const VKEY = 'thai-trip-view'
const saved = (() => { try { return localStorage.getItem(VKEY) } catch { return null } })()
const view = ref<'table' | 'cards'>((saved as 'table' | 'cards') || (window.matchMedia('(max-width: 760px)').matches ? 'cards' : 'table'))
watch(view, (v) => { try { localStorage.setItem(VKEY, v) } catch { /* ignore */ } })
const showMap = ref(!window.matchMedia('(max-width: 760px)').matches)

const cardLimit = ref(40)
watch(() => props.filters, () => (cardLimit.value = 40), { deep: true })
const selected = ref<number | null>(null)
async function select(id: number) {
  selected.value = id
  if (view.value === 'cards') {
    const i = list.value.findIndex((r) => r.id === id)
    if (i >= cardLimit.value) cardLimit.value = i + 10
    await nextTick()
    document.getElementById('c' + id)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// Фильтры → адрес страницы (?f=…), чтобы ссылкой можно было поделиться.
let t: ReturnType<typeof setTimeout> | undefined
watch(() => props.filters, () => {
  clearTimeout(t)
  t = setTimeout(() => {
    const f = encodeFilters(props.filters, props.stop)
    const q = { ...route.query }
    if (f) q.f = f; else delete q.f
    router.replace({ query: q })
  }, 300)
}, { deep: true })
</script>

<template>
  <FiltersPanel :filters="filters" :rows="data.rows" :stop="stop" :guide="guide" :shown="list.length" :total="data.rows.length" />
  <div class="viewbar">
    <div class="seg-toggle" role="group" aria-label="Вид">
      <button type="button" :aria-pressed="view === 'table'" @click="view = 'table'">Таблица</button>
      <button type="button" :aria-pressed="view === 'cards'" @click="view = 'cards'">Карточки</button>
    </div>
    <button class="link" type="button" @click="showMap = !showMap">{{ showMap ? 'Скрыть карту' : 'Показать карту' }}</button>
  </div>
  <div :class="['hstack', view === 'cards' ? 'hs-cards' : 'hs-table']">
    <HotelMap v-if="showMap" :rows="data.rows" :visible="visible" :stop="stop" :selected="selected" @select="select" />
    <HotelsTable v-if="view === 'table'" :list="list" :stop="stop" :filters="filters" :selected="selected" @select="select" />
    <div v-else class="cards">
      <HotelCard v-for="r in list.slice(0, cardLimit)" :key="r.id" :r="r" :stop="stop" :selected="selected === r.id" />
      <button v-if="list.length > cardLimit" class="more" type="button" @click="cardLimit += 40">Показать ещё {{ Math.min(40, list.length - cardLimit) }}</button>
      <p v-if="!list.length" class="empty">Под эти фильтры ничего не подходит.</p>
    </div>
  </div>
</template>
