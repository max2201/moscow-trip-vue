<script setup lang="ts">
import { computed } from 'vue'
import type { Row, Stop, Guide } from '../lib/types'
import type { Filters, FlagKey, RangeKey } from '../lib/filters'
import { FLAG_LABELS, defaultFilters } from '../lib/filters'
import { TYPES, TYPE_ORDER } from '../lib/rows'
import { TC_LABELS, tcHas } from '../lib/tcmarks'
import { useMarks } from '../composables/useMarks'
import { plural } from '../lib/format'
import { radiusText } from '../lib/maplegend'
import { useLegend } from '../composables/useLegend'

const props = defineProps<{ filters: Filters; rows: Row[]; stop: Stop; guide: Guide; shown: number; total: number }>()
const { store, version } = useMarks()
const { legend } = useLegend()
const f = props.filters

const zoneCounts = computed(() => { const c: Record<string, number> = {}; props.rows.forEach((r) => (c[r.z] = (c[r.z] || 0) + 1)); return c })
const zones = computed(() => {
  const order = props.guide.districts.map((d) => d.t)
  return Object.keys(zoneCounts.value).sort((a, b) => +props.stop.prio.includes(b) - +props.stop.prio.includes(a) || order.indexOf(a) - order.indexOf(b))
})
const typeCounts = computed(() => { const c: Record<string, number> = {}; props.rows.forEach((r) => (c[r.tg] = (c[r.tg] || 0) + 1)); return c })
const tcCounts = computed(() => Object.fromEntries(TC_LABELS.map(([k]) => [k, props.rows.filter((r) => tcHas(r.tc, k)).length])))
const savedCount = computed(() => props.rows.filter((r) => r.sv).length)
const balCount = computed(() => props.rows.filter((r) => r.balcony).length)
const balRoomCount = computed(() => props.rows.filter((r) => r.balRoom).length)
const flags = computed(() => FLAG_LABELS.filter(([k]) => k !== 'saved' || savedCount.value))
// у «Только в радиусе» вместо числа — текущий радиус круга с карты
const flagCount = (k: FlagKey) => (k === 'inradius' ? radiusText(legend.value.r) : k === 'balcony' ? balCount.value : k === 'balroom' ? balRoomCount.value : k === 'saved' ? savedCount.value : null)

const toggle = (arr: string[], v: string) => { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v) }
const RANGES: [RangeKey, RangeKey | null, string, number][] = [
  ['pmin', 'pmax', 'Цена за ночь, ₽', 100], ['mmin', 'mmax', 'Моя оценка', 0.1], ['tmin', 'tmax', 'Оценка Островка', 0.1],
  ['kmax', null, 'До Красной площади, км', 0.1], ['rmin', null, 'Отзывов не меньше', 10],
]
function setRange(k: RangeKey, v: string) {
  const n = v.trim().replace(',', '.')
  if (n === '' || isNaN(+n)) delete f.ranges[k]
  else f.ranges[k] = +n
}
function reset() { const d = defaultFilters(props.stop); Object.assign(f, d) }

const counts = computed(() => (version.value, store.counts(props.stop.id)))
const others = computed(() => (version.value, store.othersCounts(props.stop.id)))
let armed = false
function clearMarks(e: Event) {
  const b = e.target as HTMLButtonElement
  const n = counts.value.p + counts.value.m
  if (!n) { b.textContent = 'Отметок пока нет'; setTimeout(() => (b.textContent = 'Очистить мои отметки остановки'), 1500); return }
  if (armed) { store.clearStop(props.stop.id); armed = false; b.textContent = 'Очистить мои отметки остановки'; return }
  armed = true
  b.textContent = `Точно удалить ${n} ${plural(n, 'отметку', 'отметки', 'отметок')}${props.stop.merge ? ' во всех отрезках' : ''}? Нажмите ещё раз`
  setTimeout(() => { if (armed) { armed = false; b.textContent = 'Очистить мои отметки остановки' } }, 4000)
}
const typeTitle = (t: string) => (TYPES.find((x) => x[0] === t)?.[1] ?? ['без указанного типа']).join(', ')
</script>

<template>
  <div class="panel">
    <div class="prow">
      <label class="search"><span class="glabel">Поиск</span><input v-model.trim="f.q" type="search" placeholder="Название отеля"></label>
      <div class="group">
        <span class="glabel">Районы <template v-if="stop.prio.length">(обведены районы из вашего плана)</template></span>
        <div class="zones">
          <button v-for="z in zones" :key="z" type="button" :class="['chip', stop.prio.includes(z) ? 'prio' : '']" :aria-pressed="f.zones.includes(z)" @click="toggle(f.zones, z)">
            <span class="box">✓</span>{{ z }} <span class="sub">{{ zoneCounts[z] }}</span>
          </button>
          <button class="link" type="button" @click="f.zones.splice(0)">Весь город</button>
        </div>
      </div>
    </div>
    <div class="prow">
      <div class="group">
        <span class="glabel">Тип жилья</span>
        <div class="zones">
          <button v-for="t in TYPE_ORDER.filter((x) => typeCounts[x])" :key="t" type="button" class="chip" :title="typeTitle(t)" :aria-pressed="f.types.includes(t)" @click="toggle(f.types, t)">
            <span class="box">✓</span>{{ t }} <span class="sub">{{ typeCounts[t] }}</span>
          </button>
          <button class="link" type="button" @click="f.types.splice(0)">Все типы</button>
        </div>
      </div>
      <div v-if="Object.values(tcCounts).some((n) => n)" class="group">
        <span class="glabel">Отметки площадки (есть хотя бы одна из выбранных)</span>
        <div class="zones">
          <button v-for="[k, label, title] in TC_LABELS.filter(([x]) => tcCounts[x])" :key="k" type="button" class="chip" :title="title" :aria-pressed="f.tcm.includes(k)" @click="toggle(f.tcm, k)">
            <span class="box">✓</span>{{ label }} <span class="sub">{{ tcCounts[k] }}</span>
          </button>
          <button class="link" type="button" @click="f.tcm.splice(0)">Любые</button>
        </div>
      </div>
    </div>
    <div class="prow">
      <div v-for="[a, b, label, step] in RANGES" :key="a" class="group">
        <span class="glabel">{{ label }}</span>
        <div class="pair">
          <input type="number" :step="step" :placeholder="b ? 'от' : a === 'rmin' ? '0' : 'до'" :value="f.ranges[a] ?? ''" @input="setRange(a, ($event.target as HTMLInputElement).value)">
          <template v-if="b"><span>—</span><input type="number" :step="step" placeholder="до" :value="f.ranges[b] ?? ''" @input="setRange(b, ($event.target as HTMLInputElement).value)"></template>
        </div>
      </div>
    </div>
    <div class="prow">
      <button v-for="[k, label] in flags" :key="k" type="button" class="chip fc" :aria-pressed="f.flags.includes(k)" @click="toggle(f.flags, k)">
        <span class="box">✓</span>{{ label }}<span v-if="flagCount(k) != null" class="sub">{{ flagCount(k) }}</span>
      </button>
      <button v-if="f.area" type="button" class="chip fc" aria-pressed="true" title="Отели внутри области, обведённой лассо на карте. Нажмите, чтобы убрать" @click="f.area = null">
        <span class="box">✓</span>В обведённой области<span class="sub">✕</span>
      </button>
      <button class="link" type="button" @click="reset">Сбросить фильтры</button>
      <button class="link" type="button" @click="clearMarks">Очистить мои отметки остановки</button>
      <span class="count">Показано {{ shown }} из {{ total }}<template v-if="counts.p || counts.m">. Ваши отметки: +{{ counts.p }}, −{{ counts.m }}</template><template v-for="o in others" :key="o.uid">; {{ o.name }}: +{{ o.p }}, −{{ o.m }}</template></span>
    </div>
  </div>
</template>
