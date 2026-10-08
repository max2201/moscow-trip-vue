<script setup lang="ts">
import { computed } from 'vue'
import type { Stop, StopRows } from '../lib/types'
import { dec1, fmt } from '../lib/format'
import { tripLink } from '../lib/rows'
const props = defineProps<{ stop: Stop; data: StopRows; id: number; who: string }>()
const r = computed(() => props.data.rows.find((x) => x.id === props.id))
</script>
<template>
  <div class="pcard">
    <div class="who">{{ who }}</div>
    <template v-if="r">
      <h3><a :href="tripLink(id, stop, r?.o)" target="_blank" rel="noopener">{{ r.nm }}</a></h3>
      <div class="facts">
        <div><b>{{ dec1(r.my) }}</b><span>моя оценка</span></div>
        <div><b>{{ dec1(r.sc) }}</b><span>Островок</span></div>
        <div><b>{{ r.night ? fmt(r.night) + ' ₽' : 'нет цены' }}</b><span>за ночь</span></div>
        <div><b>{{ r.rank }}</b><span>место из {{ data.rows.length }}</span></div>
      </div>
      <p>Насекомые: {{ r.ins }}, запах: {{ r.sm }}, сырость: {{ r.dm }} из {{ fmt(r.an) }} отзывов. {{ r.co[0] ? r.co[0] + '.' : '' }}</p>
    </template>
    <template v-else><h3>{{ id === stop.anchor ? stop.anchorName : stop.proposedName }}</h3><p>Нет данных на Островке на эти даты.</p></template>
  </div>
</template>
