<script setup lang="ts">
import { dec1, subColor } from '../lib/format'
defineProps<{ v: number | null }>()
</script>
<template>
  <span v-if="v == null" class="sub2">—</span>
  <template v-else>
    <span class="num">{{ dec1(v) }}</span>
    <span class="bar" :style="{ color: subColor(v) }"><i :style="{ width: Math.max(0, ((v - 6) / 4) * 100) + '%' }"></i></span>
  </template>
</template>
