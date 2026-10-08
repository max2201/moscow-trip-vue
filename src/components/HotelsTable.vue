<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { Row, Stop } from '../lib/types'
import type { Filters, SortKey } from '../lib/filters'
import { ASC_FIRST } from '../lib/filters'
import { plural } from '../lib/format'
import HotelCells from './HotelCells.vue'
import { useMarks } from '../composables/useMarks'
import { headWidths, loadPins, loadRowPins, pinCss, pinStyle, rowTops, saveRowPins, savePins } from '../lib/pins'

const props = defineProps<{ list: Row[]; all: Row[]; stop: Stop; filters: Filters; selected: number | null }>()
const emit = defineEmits<{ select: [id: number] }>()
const { store, version } = useMarks()

const COLS: [SortKey, string, string][] = [
  ['mark', '±', ''], ['rank', '#', ''], ['name', 'Отель', ''], ['my', 'Моя оценка', 'из 10'],
  ['night', 'Цена за ночь', ''], ['free', 'Отмена', ''], ['km', 'До «нашего» отеля', 'по прямой'],
  ['brief', 'Коротко об отеле', 'чем известен, осторожно, где'], ['pr', 'Хвалят', ''], ['co', 'Жалуются', ''],
  ['flag', 'Красные флаги', 'отзывов с упоминанием'], ['sc', 'Trip.com', 'оценка, отзывов'], ['tcm', 'Отметки Trip.com', 'значки, рейтинги, акции'],
  ['cl', 'Чистота', ''], ['fa', 'Удобства', 'оценка гостей'], ['lo', 'Расположение', ''], ['se', 'Сервис', ''],
  ['amn', 'Что есть в отеле', ''], ['st', 'Тип', 'и звёзды'], ['yr', 'Открыт', 'год'], ['ry', 'Ремонт', 'год последнего'], ['ng', 'Негатив', 'оценки 6 и ниже'], ['ns', 'Шум', 'доля отзывов'],
]
const nightsLabel = computed(() => `за ${props.stop.nights} ${plural(props.stop.nights, 'ночь', 'ночи', 'ночей')} ниже`)

function sortBy(k: SortKey) {
  if (props.filters.sort === k) props.filters.dir = props.filters.dir === 1 ? -1 : 1
  else { props.filters.sort = k; props.filters.dir = ASC_FIRST.includes(k) ? 1 : -1 }
}

// ---- виртуальный скролл: рендерим только видимые строки
const box = ref<HTMLElement | null>(null)
const table = ref<HTMLTableElement | null>(null)
const headH = ref(52)

// ---- закреплённые строки: всегда сверху под заголовком, при любых фильтрах; остальные — ниже, без них
const rowPins = ref<number[]>(loadRowPins(props.stop.id))
watch(() => props.stop.id, (id) => { rowPins.value = loadRowPins(id) })
const pinnedRows = computed(() => { const by = new Map(props.all.map((r) => [r.id, r])); return rowPins.value.map((id) => by.get(id)).filter((r): r is Row => !!r) })
const body = computed(() => { const p = new Set(rowPins.value); return p.size ? props.list.filter((r) => !p.has(r.id)) : props.list })
const pinTops = ref<number[]>([])
const pinH = ref(0)
function toggleRow(id: number) {
  rowPins.value = rowPins.value.includes(id) ? rowPins.value.filter((x) => x !== id) : [...rowPins.value, id]
  saveRowPins(props.stop.id, rowPins.value)
  nextTick(remeasure)
}
const virt = useVirtualizer(computed(() => ({
  count: body.value.length,
  getScrollElement: () => box.value,
  estimateSize: () => 190,
  overscan: 6,
  paddingStart: headH.value + pinH.value,
  getItemKey: (i: number) => body.value[i]?.id ?? i,
})))
const items = computed(() => virt.value.getVirtualItems())
const padTop = computed(() => (items.value.length ? items.value[0].start - headH.value - pinH.value : 0))
const padBottom = computed(() => (items.value.length ? virt.value.getTotalSize() - items.value[items.value.length - 1].end : 0))
const measure = (el: unknown) => { if (el) virt.value.measureElement(el as Element) }

// ---- закреплённые столбцы: булавка в заголовке, положение считаем по реальным ширинам
const pins = ref<string[]>(loadPins())
const isPinned = (k: string) => pins.value.includes(k)
function togglePin(k: string) {
  pins.value = isPinned(k) ? pins.value.filter((x) => x !== k) : [...pins.value, k]
  savePins(pins.value)
  nextTick(remeasure)
}
const ps = pinStyle()
let ro: ResizeObserver | null = null
function remeasure() {
  const t = table.value
  if (!t) return
  ps.set(pinCss(ps.scope, headWidths(t), COLS.map(([k]) => isPinned(k))))
  headH.value = Math.round(t.querySelector('thead')?.getBoundingClientRect().height ?? 52)
  const { tops, total } = rowTops(headH.value, Array.from(t.querySelectorAll<HTMLElement>('tbody tr.pinrow')).map((tr) => tr.getBoundingClientRect().height))
  if (tops.join() !== pinTops.value.join()) pinTops.value = tops
  if (total !== pinH.value) pinH.value = total
}
onMounted(() => {
  ro = new ResizeObserver(remeasure)
  if (table.value) ro.observe(table.value)
  remeasure()
})
onBeforeUnmount(() => { ro?.disconnect(); ps.destroy() })

watch(() => props.selected, async (id) => {
  if (id == null) return
  const i = body.value.findIndex((r) => r.id === id)
  if (i >= 0) { await nextTick(); virt.value.scrollToIndex(i, { align: 'center' }) }
})
// Наверх — только когда меняются фильтры или сортировка. Раньше тут следили за массивом [sort, dir, list.length]:
// геттер возвращал новый массив при каждом пересчёте списка (в том числе после отметки), и таблица прыгала в начало.
watch(() => props.filters, () => box.value?.scrollTo({ top: 0 }), { deep: true })
const rowClass = (r: Row) => {
  version.value
  const m = store.mine(props.stop.id, r.id)
  return [r.anchor ? 'anchorrow' : '', r.proposed ? 'mark' : '', m === 1 ? 'plus' : m === -1 ? 'minus' : '', props.selected === r.id ? 'sel' : '']
}
</script>

<template>
  <div ref="box" class="tablebox vtable" :data-pt="ps.id">
    <table ref="table">
      <thead>
        <tr>
          <th v-for="([k, t, s], i) in COLS" :key="k" :class="['mkc', 'rank', 'name'][i] ?? ''"
              :aria-sort="filters.sort === k ? (filters.dir > 0 ? 'ascending' : 'descending') : undefined">
            <button type="button" @click="sortBy(k)">
              <span>{{ t }}<small v-if="s || k === 'night'">{{ k === 'night' ? nightsLabel : s }}</small></span><span class="arr">↕</span>
            </button>
            <button type="button" class="pinb" :aria-pressed="isPinned(k)" :title="isPinned(k) ? 'Открепить столбец' : 'Закрепить столбец: останется на виду при прокрутке вбок'"
                    :aria-label="(isPinned(k) ? 'Открепить' : 'Закрепить') + ' столбец «' + t + '»'" @click="togglePin(k)">
              <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1.5h4l-.6 4.2 2.6 2.3v1.3H8.7V15L8 15.8 7.3 15V9.3H4V8l2.6-2.3z"/></svg>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(r, i) in pinnedRows" :key="'p' + r.id" :class="[...rowClass(r), 'pinrow', i === pinnedRows.length - 1 ? 'plast' : '']"
            :style="{ '--pt': (pinTops[i] ?? headH) + 'px' }" @click="emit('select', r.id)">
          <HotelCells :r="r" :stop="stop" :row-pinned="true" @pin="toggleRow(r.id)" />
        </tr>
        <tr v-if="padTop > 0" class="spacer"><td :colspan="23" :style="{ height: padTop + 'px' }"></td></tr>
        <tr v-for="it in items" :key="it.key as number" :ref="measure" :data-index="it.index" :class="rowClass(body[it.index])" @click="emit('select', body[it.index].id)">
          <HotelCells :r="body[it.index]" :stop="stop" :row-pinned="false" @pin="toggleRow(body[it.index].id)" />
        </tr>
        <tr v-if="padBottom > 0" class="spacer"><td :colspan="23" :style="{ height: padBottom + 'px' }"></td></tr>
        <tr v-if="!body.length" class="emptyrow"><td colspan="23" class="empty">Под эти фильтры ничего не подходит. Снимите один из фильтров или нажмите «Весь город».</td></tr>
      </tbody>
    </table>
  </div>
</template>
