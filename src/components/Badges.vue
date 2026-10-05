<script setup lang="ts">
import { computed } from 'vue'
import type { Row, Stop } from '../lib/types'
import { badges } from '../lib/rows'
const props = defineProps<{ row: Row; stop: Stop }>()
const list = computed(() => badges(props.row, props.stop))
</script>
<template>
  <div v-if="list.length" class="badges">
    <span v-for="b in list" :key="b.text" :class="'bg-' + b.cls" :title="b.title">{{ b.text }}</span>
  </div>
</template>
