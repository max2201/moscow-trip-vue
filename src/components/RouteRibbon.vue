<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrip } from '../stores/trip'
import { useMarks } from '../composables/useMarks'
import { DOW, plural } from '../lib/format'
const trip = useTrip()
const route = useRoute()
const { store, version } = useMarks()
// Лента дней — от первого заезда до последнего выезда
const START = computed(() => new Date((trip.stops.map((s) => s.ci).sort()[0] ?? '2026-10-14') + 'T00:00:00'))
const dayIdx = (d: string) => Math.round((+new Date(d + 'T00:00:00') - +START.value) / 864e5)
const LEN = computed(() => Math.max(1, ...trip.stops.map((s) => dayIdx(s.co))))
const days = computed(() => Array.from({ length: LEN.value }, (_, i) => { const dt = new Date(+START.value + i * 864e5); return { d: dt.getDate(), w: dt.getDay(), i } }))
const segs = computed(() => (version.value, trip.stops.map((s) => ({ s, a: dayIdx(s.ci), b: dayIdx(s.co), plus: store.counts(s.id).p }))))
const hasV = computed(() => trip.stops.some((s) => s.virtual))
const tab = computed(() => (route.params.tab as string) || 'hotels')
// На узком экране лента прокручивается — показываем активную остановку.
const nav = ref<HTMLElement | null>(null)
watch(() => route.params.stop, async () => {
  await nextTick()
  nav.value?.querySelector<HTMLElement>('.seg[aria-pressed="true"], .segv[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
}, { immediate: true })
</script>
<template>
  <nav ref="nav" class="route" aria-label="Маршрут">
    <div :class="['ribbon', hasV ? 'has-v' : '']" :style="{ gridTemplateColumns: `repeat(${days.length},minmax(36px,1fr))`, minWidth: days.length * 38 + 'px' }">
      <div v-for="d in days" :key="d.i" :class="['day', d.w === 0 || d.w === 6 ? 'we' : '']" :style="{ gridColumn: d.i + 1, gridRow: 1 }"><b>{{ d.d }}</b>{{ DOW[d.w] }}</div>
      <template v-for="{ s, a, b, plus } in segs" :key="s.id">
      <!-- Объединённая остановка — тонкая плашка над отрезками, которые она собирает. -->
      <RouterLink v-if="s.virtual" :to="`/${s.id}/${tab}`" :class="['segv', 'sv-' + s.city]" :style="{ gridColumn: `${a + 1}/${b + 1}` }"
        :aria-pressed="route.params.stop === s.id" :title="`${s.title}: ${s.sub}. Отметки общие для отрезков`">
        <b lang="ru">{{ s.title }}</b><span>{{ s.days.replace(/ декабря$/, '') }}, {{ s.nights }} {{ plural(s.nights, 'ночь', 'ночи', 'ночей') }}</span>
        <span v-if="plus" class="mk">+{{ plus }}</span>
      </RouterLink>
      <RouterLink v-else :to="`/${s.id}/${tab}`" :class="['seg', 'c-' + s.city, s.nights < 2 ? 'narrow' : '']"
        :style="{ gridColumn: `${a + 1}/${b + 1}` }" :aria-pressed="route.params.stop === s.id" :title="`${s.title}: ${s.sub}, ${s.days}`">
        <strong lang="ru">{{ s.title }}</strong>
        <small><template v-if="s.nights >= 2">{{ s.sub }}<br></template>{{ s.nights }} {{ plural(s.nights, 'ночь', 'ночи', 'ночей') }}</small>
        <span v-if="plus" class="mk">+{{ plus }}</span>
      </RouterLink>
      </template>
    </div>
    <div class="legend-route"><span>Розовые числа — выходные</span></div>
  </nav>
</template>
