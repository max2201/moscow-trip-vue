<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import L from 'leaflet'
import type { Row, Stop } from '../lib/types'
import { dec, dec1, fmt, scoreColor } from '../lib/format'
import { defaultMapSize, keyResize, loadMapSize, saveMapSize, sizeStyle, startResize, type MapSize } from '../lib/mapsize'

const props = defineProps<{ rows: Row[]; visible: Set<number>; stop: Stop; selected: number | null }>()
const emit = defineEmits<{ select: [id: number] }>()
const dock = ref<HTMLElement | null>(null)
const box = ref<HTMLElement | null>(null)
const el = ref<HTMLElement | null>(null)
let map: L.Map | null = null
const markers = new Map<number, L.CircleMarker>()

// ---- размер: свой (сохранённый) или по умолчанию
const custom = ref<MapSize | null>(loadMapSize())
const size = computed(() => custom.value ?? defaultMapSize())
function onResizeStart(e: PointerEvent) {
  if (box.value) startResize(e, e.currentTarget as HTMLElement, box.value, (s) => (custom.value = s), (s) => saveMapSize(s))
}
function onResizeKey(e: KeyboardEvent) {
  const s = box.value && keyResize(e, box.value)
  if (s) { custom.value = s; saveMapSize(s) }
}
function resetSize() { custom.value = null; saveMapSize(null) }

const cssVar = (v: string) => getComputedStyle(document.documentElement).getPropertyValue(v).trim() || '#888'
const colorOf = (r: Row) => cssVar(scoreColor(r.my).slice(4, -1))

// Высота «шапки» с картой нужна таблице: она занимает остаток экрана под залипшей картой.
let ro: ResizeObserver | null = null
let raf = 0
onMounted(() => {
  if (!el.value) return
  map = L.map(el.value, { preferCanvas: true, zoomControl: true }).setView([props.stop.alat, props.stop.alng], 15)
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map)
  L.circle([props.stop.alat, props.stop.alng], { radius: 1000, color: cssVar('--accent'), weight: 1.5, dashArray: '6 6', fill: false, interactive: false }).addTo(map)
  for (const r of props.rows) {
    if (!r.la || !r.ln) continue
    const m = L.circleMarker([r.la, r.ln], { radius: r.anchor ? 9 : 6, weight: 1.5, color: '#fff', fillColor: r.anchor ? cssVar('--ink') : colorOf(r), fillOpacity: 0.95 })
      .bindTooltip(`${r.nm}: ${r.my == null ? 'нет оценки' : dec1(r.my)}${r.km != null && !r.anchor ? ', ' + dec(r.km.toFixed(1)) + ' км' : ''}${r.night ? ', ' + fmt(r.night) + ' ₽' : ''}`)
      .on('click', () => emit('select', r.id))
      .addTo(map)
    markers.set(r.id, m)
  }
  applyVisibility()

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
  map?.remove(); map = null; markers.clear()
})

function applyVisibility() {
  for (const [id, m] of markers) {
    const r = props.rows.find((x) => x.id === id)
    const on = props.visible.has(id) || r?.anchor
    m.setStyle({ fillOpacity: on ? 0.95 : 0.12, opacity: on ? 1 : 0.15, weight: props.selected === id ? 3 : 1.5, color: props.selected === id ? cssVar('--ink') : '#fff' })
    if (on) m.bringToFront()
  }
}
watch(() => props.visible, applyVisibility)
watch(() => props.selected, (id) => {
  applyVisibility()
  const m = id != null ? markers.get(id) : null
  if (m && map) { map.panTo(m.getLatLng()); m.openTooltip() }
})
</script>

<template>
  <div ref="dock" class="mapdock">
    <figure ref="box" class="mapbox" :style="sizeStyle(size)">
      <div ref="el" class="mapcanvas"></div>
      <figcaption>
        <span><i style="background:var(--good)"></i>9+</span><span><i style="background:var(--warn)"></i>8–8,9</span>
        <span><i style="background:var(--bad)"></i>ниже 8</span><span><i style="background:var(--ink)"></i>«наш» отель</span><span>пунктир — 1 км</span>
        <button v-if="custom" class="mreset" type="button" @click="resetSize">вернуть размер</button>
        <span v-else class="mhint">размер — потяни за уголок</span>
      </figcaption>
      <button class="mresize" type="button" aria-label="Изменить размер карты: тяните или используйте стрелки" title="Потяните, чтобы изменить размер. Двойной клик — вернуть как было"
              @pointerdown="onResizeStart" @keydown="onResizeKey" @dblclick="resetSize">
        <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M11 3 3 11M11 7 7 11" /></svg>
      </button>
    </figure>
  </div>
</template>
