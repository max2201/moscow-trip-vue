<script setup lang="ts">
import { computed } from 'vue'
import type { Guide, Stop, TripIndex } from '../lib/types'
const props = defineProps<{ kind: 'sights' | 'trips' | 'events'; stop: Stop; guide: Guide; index: TripIndex }>()
const STATUS: Record<string, string> = { 'подтверждено': 's-ok', 'ожидается': 's-exp', 'ориентировочно': 's-exp', 'каждую неделю': 's-week', 'каждый день': 's-week', 'праздник': 's-ok', 'совет': 's-week', 'скорее всего позже': 's-late', 'после отъезда': 's-late' }
const sights = computed(() => [...props.guide.sights].sort((a, b) => +props.stop.prio.includes(b[1]) - +props.stop.prio.includes(a[1])))
</script>
<template>
  <template v-if="kind === 'sights'">
    <p class="intro">Сначала — места в вашем районе.</p>
    <div class="list">
      <div v-for="[n, z, t] in sights" :key="n" :class="['item', stop.prio.includes(z) ? 'hl' : '']"><div class="k">{{ n }}<small>{{ z }}</small></div><p>{{ t }}</p></div>
    </div>
  </template>
  <template v-else-if="kind === 'trips'">
    <p class="intro">Время в одну сторону на машине или такси от центра.</p>
    <div class="list">
      <div v-for="[n, time, t, tip] in guide.trips" :key="n" class="item"><div class="k">{{ n }}<small>{{ time }}</small></div><div><p>{{ t }}</p><div class="tipline">{{ tip }}</div></div></div>
    </div>
  </template>
  <template v-else>
    <div class="list">
      <div v-for="[date, title, place, st, note] in stop.events" :key="title" class="item ev">
        <div><div class="date">{{ date }}</div><span :class="['status', STATUS[st] || 's-week']">{{ st }}</span></div>
        <div><p><b>{{ title }}</b>, {{ place }}</p><div class="tipline">{{ note }}</div></div>
      </div>
    </div>
    <div class="wide"><h3>Крупные события рядом с маршрутом</h3>
      <div class="list"><div v-for="[d, t, p, s] in index.tripwide" :key="t" class="item ev"><div class="date">{{ d }}</div><p><b>{{ t }}</b>, {{ p }}. <span class="sub2">{{ s }}</span></p></div></div>
    </div>
  </template>
</template>
