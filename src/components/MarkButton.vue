<script setup lang="ts">
import { computed } from 'vue'
import { useMarks } from '../composables/useMarks'

const props = defineProps<{ stop: string; id: number }>()
const { store, version } = useMarks()
const LABEL = { 0: 'Без отметки. Нажмите, чтобы поставить плюс', 1: 'Плюс. Нажмите, чтобы поставить минус', '-1': 'Минус. Нажмите, чтобы убрать отметку' } as const
const SYM = { 0: '', 1: '+', '-1': '−' } as const
const mark = computed(() => (version.value, store.mine(props.stop, props.id)))
const others = computed(() => (version.value, store.othersFor(props.stop, props.id).slice(0, 4)))
</script>

<template>
  <div class="mk-wrap">
    <button type="button" :class="['tri', 't' + mark]" :aria-label="LABEL[mark]" :title="LABEL[mark]" @click.stop="store.cycle(stop, id)">{{ SYM[mark] }}</button>
    <div v-if="others.length" class="om">
      <span v-for="[u, v] in others" :key="u" :class="['oc', v === 1 ? 'op' : 'on']" :title="`${store.nameOf(u)}: ${v === 1 ? 'плюс' : 'минус'}`">
        {{ store.nameOf(u).slice(0, 1).toUpperCase() }}{{ v === 1 ? '+' : '−' }}
      </span>
    </div>
  </div>
</template>
