<script setup lang="ts">
import type { Row } from '../lib/types'
import { dec1, scoreClass } from '../lib/format'
import { partsTitle } from '../lib/rows'
defineProps<{ row: Row }>()
</script>
<template>
  <span :class="['my', scoreClass(row.my)]" :title="partsTitle(row)">{{ row.my == null ? 'нет' : dec1(row.my) }}</span>
</template>
