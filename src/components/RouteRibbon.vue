<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useTrip } from '../stores/trip'
import { useMarks } from '../composables/useMarks'
import { DOW, plural } from '../lib/format'
const trip = useTrip()
const route = useRoute()
const { store, version } = useMarks()
const START = new Date('2026-12-06T00:00:00')
const dayIdx = (d: string) => Math.round((+new Date(d + 'T00:00:00') - +START) / 864e5)
const days = Array.from({ length: 20 }, (_, i) => { const dt = new Date(+START + i * 864e5); return { d: dt.getDate(), w: dt.getDay(), i } })
const segs = computed(() => (version.value, trip.stops.map((s) => ({ s, a: dayIdx(s.ci), b: dayIdx(s.co), plus: store.counts(s.id).p }))))
const tab = computed(() => (route.params.tab as string) || 'hotels')
// На узком экране лента прокручивается — показываем активную остановку.
const nav = ref<HTMLElement | null>(null)
watch(() => route.params.stop, async () => {
  await nextTick()
  nav.value?.querySelector<HTMLElement>('.seg[aria-pressed="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' })
}, { immediate: true })
</script>
<template>
  <nav ref="nav" class="route" aria-label="Маршрут">
    <div class="ribbon">
      <div v-for="d in days" :key="d.i" :class="['day', d.w === 0 || d.w === 6 ? 'we' : '']" :style="{ gridColumn: d.i + 1, gridRow: 1 }"><b>{{ d.d }}</b>{{ DOW[d.w] }}</div>
      <RouterLink v-for="{ s, a, b, plus } in segs" :key="s.id" :to="`/${s.id}/${tab}`" :class="['seg', 'c-' + s.city, s.nights < 2 ? 'narrow' : '']"
        :style="{ gridColumn: `${a + 1}/${b + 1}` }" :aria-pressed="route.params.stop === s.id" :title="`${s.title}: ${s.sub}, ${s.days}`">
        <strong lang="ru">{{ s.title }}</strong>
        <small><template v-if="s.nights >= 2">{{ s.sub }}<br></template>{{ s.nights }} {{ plural(s.nights, 'ночь', 'ночи', 'ночей') }}</small>
        <span v-if="plus" class="mk">+{{ plus }}</span>
      </RouterLink>
    </div>
    <div class="legend-route"><span><i class="c-bkk"></i>Бангкок</span><span><i class="c-cm"></i>Чиангмай</span><span><i class="c-cr"></i>Чианграй</span><span><i class="c-pt"></i>Ко Лан и Паттайя</span><span>Розовые числа — выходные</span></div>
  </nav>
</template>
