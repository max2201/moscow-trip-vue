<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useVirtualizer } from '@tanstack/vue-virtual'
import type { Row, Stop } from '../lib/types'
import type { Filters, SortKey } from '../lib/filters'
import { ASC_FIRST } from '../lib/filters'
import { plural } from '../lib/format'
import HotelCells from './HotelCells.vue'
import { useMarks } from '../composables/useMarks'

const props = defineProps<{ list: Row[]; stop: Stop; filters: Filters; selected: number | null }>()
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
const stickyLeft = ref<number[]>([0, 48, 88])
const virt = useVirtualizer(computed(() => ({
  count: props.list.length,
  getScrollElement: () => box.value,
  estimateSize: () => 190,
  overscan: 6,
  paddingStart: headH.value,
  getItemKey: (i: number) => props.list[i]?.id ?? i,
})))
const items = computed(() => virt.value.getVirtualItems())
const padTop = computed(() => (items.value.length ? items.value[0].start - headH.value : 0))
const padBottom = computed(() => (items.value.length ? virt.value.getTotalSize() - items.value[items.value.length - 1].end : 0))
const measure = (el: unknown) => { if (el) virt.value.measureElement(el as Element) }

// ---- закреплённые столбцы: меряем реальные размеры
let ro: ResizeObserver | null = null
function remeasure() {
  const t = table.value
  if (!t) return
  const th = t.querySelectorAll<HTMLElement>('thead th')
  let l = 0
  const lefts: number[] = []
  for (let i = 0; i < 3; i++) { lefts.push(l); l += th[i]?.getBoundingClientRect().width ?? 0 }
  stickyLeft.value = lefts
  headH.value = Math.round(t.querySelector('thead')?.getBoundingClientRect().height ?? 52)
}
onMounted(() => {
  ro = new ResizeObserver(remeasure)
  if (table.value) ro.observe(table.value)
  remeasure()
})
onBeforeUnmount(() => ro?.disconnect())

watch(() => props.selected, async (id) => {
  if (id == null) return
  const i = props.list.findIndex((r) => r.id === id)
  if (i >= 0) { await nextTick(); virt.value.scrollToIndex(i, { align: 'center' }) }
})
// Наверх — только когда меняются фильтры или сортировка. Раньше тут следили за массивом [sort, dir, list.length]:
// геттер возвращал новый массив при каждом пересчёте списка (в том числе после отметки), и таблица прыгала в начало.
watch(() => props.filters, () => box.value?.scrollTo({ top: 0 }), { deep: true })
const sticky = (i: number) => (i < 3 ? { left: stickyLeft.value[i] + 'px' } : undefined)
const rowClass = (r: Row) => {
  version.value
  const m = store.mine(props.stop.id, r.id)
  return [r.anchor ? 'anchorrow' : '', r.proposed ? 'mark' : '', m === 1 ? 'plus' : m === -1 ? 'minus' : '', props.selected === r.id ? 'sel' : '']
}
</script>

<template>
  <div ref="box" class="tablebox vtable">
    <table ref="table">
      <thead>
        <tr>
          <th v-for="([k, t, s], i) in COLS" :key="k" :class="[i < 3 ? 'sticky' : '', ['mkc', 'rank', 'name'][i] ?? '']" :style="sticky(i)"
              :aria-sort="filters.sort === k ? (filters.dir > 0 ? 'ascending' : 'descending') : undefined">
            <button type="button" @click="sortBy(k)">
              <span>{{ t }}<small v-if="s || k === 'night'">{{ k === 'night' ? nightsLabel : s }}</small></span><span class="arr">↕</span>
            </button>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="padTop > 0" class="spacer"><td :colspan="23" :style="{ height: padTop + 'px' }"></td></tr>
        <tr v-for="it in items" :key="it.key as number" :ref="measure" :data-index="it.index" :class="rowClass(list[it.index])" @click="emit('select', list[it.index].id)">
          <HotelCells :r="list[it.index]" :stop="stop" :left="stickyLeft" />
        </tr>
        <tr v-if="padBottom > 0" class="spacer"><td :colspan="23" :style="{ height: padBottom + 'px' }"></td></tr>
        <tr v-if="!list.length"><td colspan="23" class="empty">Под эти фильтры ничего не подходит. Снимите один из фильтров или нажмите «Весь город».</td></tr>
      </tbody>
    </table>
  </div>
</template>
