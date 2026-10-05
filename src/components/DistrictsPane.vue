<script setup lang="ts">
import { computed } from 'vue'
import type { Guide, Stop, StopRows } from '../lib/types'
import { cityCleanShare, zoneStats } from '../lib/rows'
import { fmt, plural } from '../lib/format'
const props = defineProps<{ stop: Stop; data: StopRows; guide: Guide }>()
const emit = defineEmits<{ showZone: [zone: string] }>()
const cc = computed(() => cityCleanShare(props.data.rows))
const cards = computed(() => [...props.guide.districts]
  .sort((a, b) => +props.stop.prio.includes(b.t) - +props.stop.prio.includes(a.t))
  .map((d) => ({ d, st: zoneStats(props.data.rows, [d.t]), prio: props.stop.prio.includes(d.t) })))
const cleanCls = (v: number | null) => (v == null ? '' : v >= cc.value + 8 ? 't-g' : v <= cc.value - 8 ? 't-b' : '')
</script>
<template>
  <p class="intro">{{ guide.intro }} «Чистые» — отели без единого упоминания насекомых, запаха и сырости; в среднем по городу на эти даты таких {{ cc }}%.</p>
  <div class="gcards">
    <article v-for="{ d, st, prio } in cards" :key="d.t" :class="['gcard', prio ? 'prio' : '']">
      <div v-if="prio" class="yours">Район из вашего плана</div>
      <div><h4>{{ d.t }}</h4><p class="tg">{{ d.tag }}</p></div>
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
</template>
