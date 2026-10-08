<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Guide, Stop, TripIndex } from '../lib/types'
import { scrollToCard, type PlaceItem } from '../lib/placesmap'
import PlacesMap from './PlacesMap.vue'
const props = defineProps<{ kind: 'sights' | 'trips' | 'events'; stop: Stop; guide: Guide; index: TripIndex }>()
const STATUS: Record<string, string> = { 'подтверждено': 's-ok', 'ожидается': 's-exp', 'ориентировочно': 's-exp', 'каждую неделю': 's-week', 'каждый день': 's-week', 'праздник': 's-ok', 'совет': 's-week', 'скорее всего позже': 's-late', 'после отъезда': 's-late' }
const sights = computed(() => [...props.guide.sights].sort((a, b) => +props.stop.prio.includes(b[1]) - +props.stop.prio.includes(a[1])))
// Места на карте: номер точки = номер карточки; у мест без координат (например, «День Конституции») номера нет
const places = computed(() => props.index.places?.[props.stop.city]?.[props.kind] ?? {})
const names = computed(() => (props.kind === 'sights' ? sights.value.map((s) => s[0]) : props.kind === 'trips' ? props.guide.trips.map((t) => t[0]) : props.stop.events.map((e) => e[1])))
const nums = computed(() => { const m: Record<string, number> = {}; let n = 0; for (const nm of names.value) if (places.value[nm] && !(nm in m)) m[nm] = ++n; return m })
const items = computed<PlaceItem[]>(() => Object.entries(nums.value).map(([nm, n]) => ({ id: nm, n, name: nm, ll: places.value[nm], prio: props.kind === 'sights' && props.stop.prio.includes(sights.value.find((s) => s[0] === nm)?.[1] ?? '') })))
const anchor = computed(() => (props.stop.alat ? { ll: [props.stop.alat, props.stop.alng] as [number, number], name: props.stop.anchor ? 'Отель по плану: ' + props.stop.anchorName : props.stop.anchorName } : null))
const hover = ref<string | null>(null)
const on = (id: string) => ({ 'data-place': id, onMouseenter: () => (hover.value = id), onMouseleave: () => (hover.value = null) })
</script>
<template>
  <div class="pwrap">
    <div class="plist">
      <template v-if="kind === 'sights'">
        <p class="intro">Сначала — места в вашем районе.</p>
        <div class="list">
          <div v-for="[n, z, t] in sights" :key="n" v-bind="on(n)" :class="['item', stop.prio.includes(z) ? 'hl' : '', hover === n ? 'pm-on' : '']">
            <div class="k"><span v-if="nums[n]" :class="['pm-n', stop.prio.includes(z) ? 'prio' : '']">{{ nums[n] }}</span>{{ n }}<small>{{ z }}</small></div><p>{{ t }}</p>
          </div>
        </div>
      </template>
      <template v-else-if="kind === 'trips'">
        <p class="intro">Время в одну сторону на машине или такси от центра.</p>
        <div class="list">
          <div v-for="[n, time, t, tip] in guide.trips" :key="n" v-bind="on(n)" :class="['item', hover === n ? 'pm-on' : '']">
            <div class="k"><span v-if="nums[n]" class="pm-n">{{ nums[n] }}</span>{{ n }}<small>{{ time }}</small></div><div><p>{{ t }}</p><div class="tipline">{{ tip }}</div></div>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="list">
          <div v-for="[date, title, place, st, note] in stop.events" :key="title" v-bind="on(title)" :class="['item', 'ev', hover === title ? 'pm-on' : '']">
            <div><div class="date"><span v-if="nums[title]" class="pm-n">{{ nums[title] }}</span>{{ date }}</div><span :class="['status', STATUS[st] || 's-week']">{{ st }}</span></div>
            <div><p><b>{{ title }}</b>, {{ place }}</p><div class="tipline">{{ note }}</div></div>
          </div>
        </div>
        <div class="wide"><h3>Крупные события рядом с маршрутом</h3>
          <div class="list"><div v-for="[d, t, p, s] in index.tripwide" :key="t" class="item ev"><div class="date">{{ d }}</div><p><b>{{ t }}</b>, {{ p }}. <span class="sub2">{{ s }}</span></p></div></div>
        </div>
      </template>
    </div>
    <PlacesMap :items="items" :anchor="anchor" :hover="hover" @pick="scrollToCard" @hover="(id) => (hover = id)" />
  </div>
</template>
