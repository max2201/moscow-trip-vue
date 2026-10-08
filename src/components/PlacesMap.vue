<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { createPlacesMap, type LatLng, type PlaceItem, type PlacesMap } from '../lib/placesmap'

/** Карта рядом со списком карточек: номера точек = номера карточек. hover — какая карточка под курсором. */
const props = defineProps<{ items: PlaceItem[]; anchor?: { ll: LatLng; name: string } | null; hover: string | null }>()
const emit = defineEmits<{ pick: [id: string]; hover: [id: string | null] }>()
const el = ref<HTMLElement | null>(null)
let pm: PlacesMap | null = null
let ro: ResizeObserver | null = null
onMounted(() => {
  if (!el.value) return
  pm = createPlacesMap(el.value, (id) => emit('pick', id), (id) => emit('hover', id))
  pm.set(props.items, props.anchor)
  ro = new ResizeObserver(() => pm?.invalidate())
  ro.observe(el.value)
})
watch(() => [props.items, props.anchor], () => pm?.set(props.items, props.anchor))
watch(() => props.hover, (id) => pm?.highlight(id))
onBeforeUnmount(() => { ro?.disconnect(); pm?.destroy(); pm = null })
</script>

<template>
  <aside class="pmap">
    <div ref="el" class="pmap-canvas"></div>
    <p class="pmap-note"><span class="pm-dot"></span>номер на карте = номер карточки · <span class="pm-home-k"></span>отель по плану</p>
  </aside>
</template>
