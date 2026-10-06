<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import type { Row, Stop } from '../lib/types'
import { scoreColor } from '../lib/format'
import { boxStyle, canvasStyle, defaultMapSize, keyResize, loadMapSize, saveMapSize, startResize, type MapSize } from '../lib/mapsize'
import {
  LEGEND_MARK, LEGEND_SCORE, R_MAX, R_MIN, R_STEP, legendCounts, parseRadius, pinHtml, radiusText,
  shownOnMap, toggleKey, tooltipHtml, type LegendKey,
} from '../lib/maplegend'
import { useMarks } from '../composables/useMarks'
import { useLegend } from '../composables/useLegend'

const props = defineProps<{ rows: Row[]; visible: Set<number>; stop: Stop; selected: number | null }>()
const emit = defineEmits<{ select: [id: number] }>()
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
const setRadius = (r: number) => setLegend({ off: legend.value.off.filter((k) => k !== 'ring'), r })
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
const counts = computed(() => (version.value, legendCounts(props.rows, props.visible, mineOf)))

const cssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888'
const colorOf = (r: Row) => (r.anchor ? cssVar('--ink') : cssVar(scoreColor(r.my).slice(4, -1)))

// ---- точки: обычные рисуем на canvas, отмеченные — значками с «+»/«−» поверх
interface Entry { layer: L.CircleMarker | L.Marker; kind: string; on: boolean }
const entries = new Map<number, Entry>()

function makeLayer(r: Row, ll: L.LatLngTuple, mark: number, sel: boolean): L.CircleMarker | L.Marker {
  const layer = mark
    ? L.marker(ll, { icon: L.divIcon({ className: 'mpin-wrap', html: pinHtml(mark, colorOf(r), sel), iconSize: [22, 22], iconAnchor: [11, 11] }), keyboard: false, riseOnHover: true, zIndexOffset: mark === 1 ? 500 : 0 })
    : L.circleMarker(ll, { radius: r.anchor ? 9 : 6, weight: 1.5, color: '#fff', fillColor: colorOf(r), fillOpacity: 0.95 })
  layer.bindTooltip('')
  layer.on('click', () => emit('select', r.id))
  return layer
}

function render() {
  if (!map || !group) return
  const off = legend.value.off
  for (const r of props.rows) {
    if (!r.la || !r.ln) continue
    const mark = mineOf(r.id)
    const sel = props.selected === r.id
    const kind = mark ? `${mark}${sel ? 's' : ''}` : '0'
    let e = entries.get(r.id)
    if (e && e.kind !== kind) { group.removeLayer(e.layer); entries.delete(r.id); e = undefined }
    if (!shownOnMap(r, mark, props.visible, off, props.selected)) {
      if (e?.on) { group.removeLayer(e.layer); e.on = false }
      continue
    }
    if (!e) { e = { layer: makeLayer(r, [r.la, r.ln], mark, sel), kind, on: false }; entries.set(r.id, e) }
    if (!e.on) { group.addLayer(e.layer); e.on = true }
    if (e.layer instanceof L.CircleMarker) {
      e.layer.setStyle({ weight: sel ? 3 : 1.5, color: sel ? cssVar('--ink') : '#fff' })
      if (sel || r.anchor) e.layer.bringToFront()
    }
    const others = store.othersFor(props.stop.id, r.id).map(([u, v]) => [store.nameOf(u), v] as [string, number])
    e.layer.setTooltipContent(tooltipHtml(r, mark, others))
  }
  if (ring) {
    ring.setRadius(legend.value.r)
    if (isOn('ring')) { if (!map.hasLayer(ring)) ring.addTo(map) } else ring.remove()
  }
}

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
  map?.remove(); map = null; group = null; ring = null; entries.clear()
})

watch([() => props.visible, () => props.selected, version, legend], render)
// Подсказка открыта только у выбранного отеля: прежнюю закрываем, иначе они копятся на карте.
let openTip: L.Layer | null = null
watch(() => props.selected, (id) => {
  openTip?.closeTooltip(); openTip = null
  const e = id != null ? entries.get(id) : null
  if (e && map) { map.panTo(e.layer.getLatLng()); e.layer.openTooltip(); openTip = e.layer }
})
</script>

<template>
  <div ref="dock" class="mapdock">
    <figure ref="box" class="mapbox" :style="boxStyle(size)">
      <div ref="el" class="mapcanvas" :style="canvasStyle(size)"></div>
      <figcaption>
        <div class="lg" role="group" aria-label="Что показывать на карте (на выборку в таблице не влияет)">
          <button v-for="[k, label, c] in LEGEND_SCORE" :key="k" type="button" class="lgc" :aria-pressed="isOn(k)" @click="toggle(k)">
            <i class="lgdot" :style="{ background: `var(${c})` }"></i><span class="lgl">{{ label }}</span><small>{{ counts[k] ?? 0 }}</small>
          </button>
          <span class="lgsep" aria-hidden="true"></span>
          <button v-for="[k, label, m] in LEGEND_MARK" :key="k" type="button" class="lgc" :aria-pressed="isOn(k)" @click="toggle(k)">
            <i :class="['lgpin', 'lp' + m]">{{ m === 1 ? '+' : m === -1 ? '−' : '' }}</i><span class="lgl">{{ label }}</span><small>{{ counts[k] ?? 0 }}</small>
          </button>
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
