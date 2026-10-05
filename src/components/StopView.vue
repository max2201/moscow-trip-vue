<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTrip } from '../stores/trip'
import { TABS, type Tab } from '../router'
import { fmt, plural } from '../lib/format'
import PlanCard from './PlanCard.vue'
import HotelsPane from './HotelsPane.vue'
import DistrictsPane from './DistrictsPane.vue'
import ListPanes from './ListPanes.vue'

const props = defineProps<{ stop: string; tab?: string }>()
const trip = useTrip()
const route = useRoute()
const router = useRouter()
const s = computed(() => trip.stopById(props.stop))
const tab = computed<Tab>(() => (TABS.includes(props.tab as Tab) ? (props.tab as Tab) : 'hotels'))
const loading = ref(true)
const error = ref('')

watch(s, async (stop) => {
  if (!stop) { router.replace('/s1'); return }
  loading.value = true; error.value = ''
  try { await trip.ensureStop(stop); trip.filtersFor(stop, (route.query.f as string) ?? null) }
  catch (e) { error.value = String(e) }
  loading.value = false
}, { immediate: true })

const data = computed(() => (s.value ? trip.rows[s.value.id] : undefined))
const guide = computed(() => (s.value ? trip.index!.guides[s.value.city] : undefined))
const filters = computed(() => (s.value ? trip.filters[s.value.id] : undefined))
const TAB_LABELS: Record<Tab, string> = { hotels: 'Отели', districts: 'Районы', sights: 'Что посмотреть', trips: 'Поездки до 2 часов', events: 'События на ваши даты' }
const tabCount = (t: Tab) => {
  if (!s.value || !guide.value) return ''
  return { hotels: data.value?.rows.length ?? s.value.priceCount, districts: guide.value.districts.length, sights: guide.value.sights.length, trips: guide.value.trips.length, events: s.value.events.length }[t]
}
function showZone(z: string) {
  if (!filters.value) return
  filters.value.zones.splice(0, filters.value.zones.length, z)
  router.push({ path: `/${props.stop}/hotels`, query: route.query })
}
</script>

<template>
  <main v-if="s" class="stop">
    <div class="shead"><div>
      <h2><span :class="['cityline', 'c-' + s.city]"></span>{{ s.title }}: {{ s.sub }}</h2>
      <div class="sub">{{ s.days }}, {{ s.nights }} {{ plural(s.nights, 'ночь', 'ночи', 'ночей') }}{{ s.together ? ', вместе' : ', живёте раздельно' }}. В таблице — все отели города до {{ fmt(s.limit) }} ₽ за ночь</div>
    </div></div>
    <div v-if="error" class="err">Не удалось загрузить данные: {{ error }}</div>
    <div v-else-if="loading || !data || !guide || !filters" class="loading">Загружаю отели…</div>
    <template v-else>
      <div class="planned">
        <PlanCard v-if="s.anchor === s.proposed" :stop="s" :data="data" :id="s.anchor" who="Отель по плану — от него считаются расстояния" />
        <template v-else>
          <PlanCard :stop="s" :data="data" :id="s.proposed" who="Предложен вам в плане" />
          <PlanCard :stop="s" :data="data" :id="s.anchor" who="«Наш отель» из плана — от него считаются расстояния" />
        </template>
      </div>
      <p class="note">{{ s.note }}</p>
      <nav class="tabs" role="tablist">
        <RouterLink v-for="t in TABS" :key="t" :to="{ path: `/${s.id}/${t}`, query: route.query }" class="tab" role="tab" :aria-selected="tab === t">
          {{ TAB_LABELS[t] }}<span class="n">{{ tabCount(t) }}</span>
        </RouterLink>
      </nav>
      <HotelsPane v-if="tab === 'hotels'" :stop="s" :data="data" :guide="guide" :filters="filters" />
      <DistrictsPane v-else-if="tab === 'districts'" :stop="s" :data="data" :guide="guide" @show-zone="showZone" />
      <ListPanes v-else :kind="tab" :stop="s" :guide="guide" :index="trip.index!" />
    </template>
  </main>
</template>
