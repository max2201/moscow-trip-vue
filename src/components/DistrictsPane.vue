<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Guide, Stop, StopRows } from '../lib/types'
import { cityCleanShare, zoneStats } from '../lib/rows'
import { fmt, plural } from '../lib/format'
import { districtArea, scrollToCard, type PlaceItem } from '../lib/placesmap'
import PlacesMap from './PlacesMap.vue'
const props = defineProps<{ stop: Stop; data: StopRows; guide: Guide }>()
const emit = defineEmits<{ showZone: [zone: string] }>()
const cc = computed(() => cityCleanShare(props.data.rows))
const cards = computed(() => [...props.guide.districts]
  .sort((a, b) => +props.stop.prio.includes(b.t) - +props.stop.prio.includes(a.t))
  .map((d, i) => ({ d, n: i + 1, st: zoneStats(props.data.rows, [d.t]), prio: props.stop.prio.includes(d.t) })))
const cleanCls = (v: number | null) => (v == null ? '' : v >= cc.value + 8 ? 't-g' : v <= cc.value - 8 ? 't-b' : '')
// Районы на карте — области по отелям их зон
const items = computed<PlaceItem[]>(() => cards.value.map(({ d, n, prio }) => ({ id: d.t, n, name: d.t, area: d.z.length ? districtArea(props.data.rows, [d.t, ...d.z]) ?? undefined : undefined, prio })))
const anchor = computed(() => (props.stop.alat ? { ll: [props.stop.alat, props.stop.alng] as [number, number], name: props.stop.anchor ? 'Отель по плану: ' + props.stop.anchorName : props.stop.anchorName } : null))
const hover = ref<string | null>(null)
</script>
<template>
  <p class="intro">{{ guide.intro }} «Чистые» — отели без единого упоминания насекомых, запаха и сырости; в среднем по городу на эти даты таких {{ cc }}%.</p>
  <div class="pwrap">
    <div class="gcards">
      <article v-for="{ d, n, st, prio } in cards" :key="d.t" :data-place="d.t" :class="['gcard', prio ? 'prio' : '', hover === d.t ? 'pm-on' : '']"
               @mouseenter="hover = d.t" @mouseleave="hover = null">
        <div v-if="prio" class="yours">Район из вашего плана</div>
        <div><h4><span :class="['pm-n', prio ? 'prio' : '']">{{ n }}</span>{{ d.t }}</h4><p class="tg">{{ d.tag }}</p></div>
        <dl><dt>Что там</dt><dd>{{ d.what }}</dd><dt class="dp">Плюсы</dt><dd>{{ d.pro }}</dd><dt class="dm">Минусы</dt><dd>{{ d.con }}</dd><dt>Кому</dt><dd>{{ d.who }}</dd></dl>
        <div class="gstats">
          <div><b>{{ st.n }}</b><span>отелей</span></div>
          <div><b>{{ st.med ? fmt(st.med) + ' ₽' : '—' }}</b><span>медиана за ночь</span></div>
          <div><b :class="cleanCls(st.clean)">{{ st.clean == null ? '—' : st.clean + '%' }}</b><span>чистых</span></div>
          <div v-if="st.gems"><b>{{ st.gems }}</b><span>{{ plural(st.gems, 'находка', 'находки', 'находок') }}</span></div>
        </div>
        <button v-if="st.n" class="gbtn" type="button" @click="emit('showZone', d.t)">Показать отели района</button>
      </article>
    </div>
    <PlacesMap :items="items" :anchor="anchor" :hover="hover" @pick="scrollToCard" @hover="(id) => (hover = id)" />
  </div>
</template>
