<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import { hoverHotel, setPointHover } from '../lib/hover'
import type { Row, Stop } from '../lib/types'
import { scoreColor } from '../lib/format'
import { boxStyle, canvasStyle, defaultMapSize, keyResize, loadMapSize, saveMapSize, startResize, type MapSize } from '../lib/mapsize'
import {
  LEGEND_MARK, LEGEND_SCORE, R_MAX, R_MIN, R_STEP, legendCounts, parseRadius, pinHtml, radiusText,
  shownMark, shownOnMap, toggleKey, tooltipHtml, type LegendKey,
} from '../lib/maplegend'
import type { Area } from '../lib/lasso'
import { attachLasso, drawArea, type Lasso } from '../lib/lassodraw'
import { useMarks } from '../composables/useMarks'
import { useLegend } from '../composables/useLegend'

const props = defineProps<{ rows: Row[]; visible: Set<number>; stop: Stop; selected: number | null; area: Area | null }>()
const emit = defineEmits<{ select: [id: number]; area: [a: Area | null] }>()
const { store, version } = useMarks()
const dock = ref<HTMLElement | null>(null)
const box = ref<HTMLElement | null>(null)
const el = ref<HTMLElement | null>(null)
let map: L.Map | null = null
let group: L.LayerGroup | null = null
let ring: L.Circle | null = null

// ---- размер: свой (сохранённый) или по умолчанию
const custom = ref<MapSize | null>(loadMapSize())
const size = computed(() => custom.value ?? defaultMapSize())
function onResizeStart(e: PointerEvent) {
  if (box.value && el.value) startResize(e, e.currentTarget as HTMLElement, box.value, el.value, (s) => (custom.value = s), (s) => saveMapSize(s))
}
function onResizeKey(e: KeyboardEvent) {
  const s = box.value && el.value && keyResize(e, box.value, el.value)
  if (s) { custom.value = s; saveMapSize(s) }
}
function resetSize() { custom.value = null; saveMapSize(null) }

// ---- легенда-пульт: меняет только то, что видно на карте (радиус ещё читает флажок «Только в радиусе»)
const { legend, setLegend } = useLegend()
const isOn = (k: LegendKey) => !legend.value.off.includes(k)
const toggle = (k: LegendKey) => setLegend(toggleKey(legend.value, k))
const setRadius = (r: number) => setLegend({ ...legend.value, off: legend.value.off.filter((k) => k !== 'ring'), r })
function onRadius(e: Event) { setRadius(+(e.target as HTMLInputElement).value) }
// Радиус текстом: «1,5», «800 м»… Применяем по Enter или при уходе из поля, Esc — отмена.
function onRadiusText(e: Event) {
  const el = e.target as HTMLInputElement
  const v = parseRadius(el.value)
  if (v != null) setRadius(v)
  el.value = radiusText(v ?? legend.value.r)
}
function onRadiusKey(e: KeyboardEvent) {
  const el = e.target as HTMLInputElement
  if (e.key === 'Enter') el.blur()
  if (e.key === 'Escape') { el.value = radiusText(legend.value.r); el.blur() }
}
const mineOf = (id: number) => store.mine(props.stop.id, id)
const othersOf = (id: number) => store.othersFor(props.stop.id, id).map(([u, v]) => [store.nameOf(u), v] as [string, number])
// Отметка на карте: только моя или (галочка «отметки всех») — моя, а если её нет, то чужая
const markOf = (id: number) => shownMark(mineOf(id), legend.value.all ? othersOf(id) : [], legend.value.all)
const counts = computed(() => (version.value, legendCounts(props.rows, props.visible, markOf)))

const cssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888'
const colorOf = (r: Row) => (r.anchor ? cssVar('--ink') : cssVar(scoreColor(r.my).slice(4, -1)))

// ---- точки: обычные рисуем на canvas, отмеченные — значками с «+»/«−» поверх
interface Entry { layer: L.CircleMarker | L.Marker; kind: string; on: boolean }
const entries = new Map<number, Entry>()

function makeLayer(r: Row, ll: L.LatLngTuple, mark: number, sel: boolean, foreign: boolean): L.CircleMarker | L.Marker {
  const layer = mark
    ? L.marker(ll, { icon: L.divIcon({ className: 'mpin-wrap', html: pinHtml(mark, colorOf(r), sel, foreign), iconSize: [22, 22], iconAnchor: [11, 11] }), keyboard: false, riseOnHover: true, zIndexOffset: mark === 1 ? 500 : 0 })
    : L.circleMarker(ll, { radius: r.anchor ? 9 : 6, weight: 1.5, color: '#fff', fillColor: colorOf(r), fillOpacity: 0.95 })
  layer.bindTooltip('')
  layer.on('click', () => onPointClick(r.id))
  return layer
}

// Первый клик по точке выделяет отель (как клик по строке таблицы), следующие клики по уже выделенной
// точке переключают мою отметку: «+» → «−» → без отметки → снова «+».
// Выделенную кликом по карте точку не двигаем к центру: она должна остаться под курсором для следующего клика.
let fromMap = false
function onPointClick(id: number) {
  if (props.selected === id) store.cycle(props.stop.id, id)
  else { fromMap = true; emit('select', id) }
}
// Подсказка открыта только у выбранного отеля: прежнюю закрываем, иначе они копятся на карте.
let openTip: L.Layer | null = null

function render() {
  if (!map || !group) return
  const off = legend.value.off
  for (const r of props.rows) {
    if (!r.la || !r.ln) continue
    const mine = mineOf(r.id)
    const mark = markOf(r.id)
    const foreign = !!mark && !mine
    const sel = props.selected === r.id
    const kind = mark ? `${mark}${sel ? 's' : ''}${foreign ? 'o' : ''}` : '0'
    let e = entries.get(r.id)
    let created = false
    if (e && e.kind !== kind) { group.removeLayer(e.layer); entries.delete(r.id); e = undefined }
    if (!shownOnMap(r, mark, props.visible, off, props.selected)) {
      if (e?.on) { group.removeLayer(e.layer); e.on = false }
      continue
    }
    if (!e) { e = { layer: makeLayer(r, [r.la, r.ln], mark, sel, foreign), kind, on: false }; entries.set(r.id, e); created = true }
    if (!e.on) { group.addLayer(e.layer); e.on = true }
    if (e.layer instanceof L.CircleMarker) {
      e.layer.setStyle({ weight: sel ? 3 : 1.5, color: sel ? cssVar('--ink') : '#fff' })
      if (sel || r.anchor) e.layer.bringToFront()
    }
    e.layer.setTooltipContent(tooltipHtml(r, mine, othersOf(r.id), sel))
    // Отметка сменилась — точка пересоздана другим значком: подсказку выбранной открываем заново
    if (sel && created) { e.layer.openTooltip(); openTip = e.layer }
  }
  const h = hoverHotel.get()
  if (h != null) setPointHover(entries.get(h)?.layer, true, cssVar('--ink'))
  if (ring) {
    ring.setRadius(legend.value.r)
    if (isOn('ring')) { if (!map.hasLayer(ring)) ring.addTo(map) } else ring.remove()
  }
}

// ---- лассо: обвести область на карте → таблица покажет только отели внутри неё
const lassoOn = ref(false)
let lasso: Lasso | null = null
let areaLayer: L.Polygon | null = null
const showArea = () => { if (map) areaLayer = drawArea(map, props.area, cssVar('--accent'), areaLayer) }
watch(() => props.area, showArea)

// Высота «шапки» с картой нужна таблице: она занимает остаток экрана под картой.
let ro: ResizeObserver | null = null
let raf = 0
onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, { preferCanvas: true, zoomControl: true }).setView([props.stop.alat, props.stop.alng], 15)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)
  ring = L.circle([props.stop.alat, props.stop.alng], { radius: legend.value.r, color: cssVar('--accent'), weight: 1.5, dashArray: '6 6', fill: false, interactive: false })
  group = L.layerGroup().addTo(map)
  render()
  lasso = attachLasso(map, cssVar('--accent'), (a) => emit('area', a), (on) => (lassoOn.value = on))
  showArea()

  ro = new ResizeObserver(() => {
    const d = dock.value
    if (d?.parentElement) d.parentElement.style.setProperty('--dockh', d.offsetHeight + 'px')
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => map?.invalidateSize({ pan: false }))
  })
  if (dock.value) ro.observe(dock.value)
  if (box.value) ro.observe(box.value)
})
onBeforeUnmount(() => {
  ro?.disconnect()
  cancelAnimationFrame(raf)
  dock.value?.parentElement?.style.removeProperty('--dockh')
  lasso?.destroy(); lasso = null; areaLayer = null
  map?.remove(); map = null; group = null; ring = null; entries.clear()
})

// Наведение на название отеля в таблице: точка подрастает
const offHover = hoverHotel.on((id, prev) => {
  if (prev != null) setPointHover(entries.get(prev)?.layer, false, '')
  if (id != null) setPointHover(entries.get(id)?.layer, true, cssVar('--ink'))
})
onBeforeUnmount(offHover)
watch([() => props.visible, () => props.selected, version, legend], render)
watch(() => props.selected, (id) => {
  openTip?.closeTooltip(); openTip = null
  const e = id != null ? entries.get(id) : null
  if (e && map) { if (!fromMap) map.panTo(e.layer.getLatLng()); e.layer.openTooltip(); openTip = e.layer }
  fromMap = false
})
</script>

<template>
  <div ref="dock" class="mapdock">
    <figure ref="box" class="mapbox" :style="boxStyle(size)">
      <div ref="el" class="mapcanvas" :style="canvasStyle(size)"></div>
      <div class="mtools">
        <button type="button" class="mtool" :aria-pressed="lassoOn" title="Обвести область на карте: в таблице останутся только отели внутри неё" @click="lasso?.set(!lassoOn)">
          <svg viewBox="0 0 20 20" aria-hidden="true"><ellipse cx="10.5" cy="7.5" rx="7.5" ry="5" stroke-dasharray="2.6 2.2" /><path d="M5.5 11.3c-1.6 1.4-1.5 3.6.2 4.4 1.4.7 3-.2 2.9-1.6" /></svg>
          {{ lassoOn ? 'Обведите область…' : 'Лассо' }}
        </button>
        <button v-if="area" type="button" class="mtool" title="Убрать обведённую область из фильтров" @click="emit('area', null)">✕ Сбросить область</button>
      </div>
      <div v-if="lassoOn" class="mlasso-hint">Обведите область, не отпуская кнопку мыши или палец. Esc — отмена</div>
      <figcaption>
        <div class="lg" role="group" aria-label="Что показывать на карте (на выборку в таблице не влияет)">
          <button v-for="[k, label, c] in LEGEND_SCORE" :key="k" type="button" class="lgc" :aria-pressed="isOn(k)" @click="toggle(k)">
            <i class="lgdot" :style="{ background: `var(${c})` }"></i><span class="lgl">{{ label }}</span><small>{{ counts[k] ?? 0 }}</small>
          </button>
          <span class="lgsep" aria-hidden="true"></span>
          <button v-for="[k, label, m] in LEGEND_MARK" :key="k" type="button" class="lgc" :aria-pressed="isOn(k)" @click="toggle(k)">
            <i :class="['lgpin', 'lp' + m]">{{ m === 1 ? '+' : m === -1 ? '−' : '' }}</i><span class="lgl">{{ label }}</span><small>{{ counts[k] ?? 0 }}</small>
          </button>
          <label class="lgall" title="Плюсы и минусы всех участников, а не только ваши. Чужие — с пунктирной обводкой">
            <input type="checkbox" :checked="legend.all" @change="setLegend({ ...legend, all: !legend.all })">отметки всех
          </label>
          <span class="lgsep" aria-hidden="true"></span>
          <button type="button" class="lgc" :aria-pressed="isOn('anchor')" @click="toggle('anchor')">
            <i class="lgdot lgbig" style="background:var(--ink)"></i><span class="lgl">«наш» отель</span>
          </button>
          <span class="lgring">
            <button type="button" class="lgc" :aria-pressed="isOn('ring')" @click="toggle('ring')"><i class="lgcirc"></i><span class="lgl">радиус</span></button>
            <input type="range" :min="R_MIN" :max="R_MAX" :step="R_STEP" :value="legend.r" aria-label="Радиус круга вокруг «нашего» отеля" @input="onRadius">
            <input class="lgnum" type="text" inputmode="decimal" :value="radiusText(legend.r)" aria-label="Радиус текстом, например 1,5 или 800 м"
                   title="Можно ввести: 1,5 · 1.5 км · 800 · 800 м (от 100 м до 5 км)" @focus="($event.target as HTMLInputElement).select()" @change="onRadiusText" @keydown="onRadiusKey">
          </span>
          <button v-if="legend.off.length" type="button" class="lglink" @click="setLegend({ ...legend, off: [] })">показать всё</button>
        </div>
        <button v-if="custom" class="mreset" type="button" @click="resetSize">вернуть размер</button>
        <span v-else class="mhint">размер ↘</span>
      </figcaption>
      <button class="mresize" type="button" aria-label="Изменить размер карты: тяните или используйте стрелки" title="Потяните, чтобы изменить размер. Двойной клик — вернуть как было"
              @pointerdown="onResizeStart" @keydown="onResizeKey" @dblclick="resetSize">
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M11 3 3 11M11 7 7 11" /></svg>
      </button>
    </figure>
  </div>
</template>
