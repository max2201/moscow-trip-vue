<script setup lang="ts">
import type { Row } from '../lib/types'
import { dec1, scoreClass } from '../lib/format'
import { partsTitle } from '../lib/rows'
import { ratingBasis, ratingLabel } from '../lib/rating'
defineProps<{ row: Row }>()
</script>
<template>
  <span class="rating-score" :title="partsTitle(row)"><span :class="['my', scoreClass(row.my)]">{{ ratingBasis(row) === 'none' ? '?' : row.an < 20 ? '≈' : '' }}{{ dec1(row.my) }}</span><small>{{ ratingLabel(row) }}</small></span>
</template>
<style scoped>
.rating-score { display:inline-flex; flex-direction:column; align-items:center; gap:3px; }
.rating-score small { font-size:10px; color:var(--muted); max-width:90px; text-align:center; line-height:1.2; }
</style>
