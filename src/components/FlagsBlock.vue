<script setup lang="ts">
import type { Row } from '../lib/types'
import { fmt } from '../lib/format'
defineProps<{ row: Row }>()
</script>
<template>
  <template v-if="row.an">
    <div class="flags">
      <span :class="row.insLvl">Насекомые: {{ row.ins }}<em v-if="row.ins"> ({{ row.insr }})</em></span>
      <small v-if="row.ins">тараканы, клопы {{ row.ro }}; муравьи, комары {{ row.at }}</small>
      <span :class="row.smLvl">Запах: {{ row.sm }}<em v-if="row.sm"> ({{ row.smr }})</em></span>
      <span :class="row.dmLvl">Сырость: {{ row.dm }}<em v-if="row.dm"> ({{ row.dmr }})</em></span>
    </div>
    <div class="sub2" style="margin-top:4px">из {{ fmt(row.an) }} прочитанных<template v-if="row.tot > row.an"> (всего {{ fmt(row.tot) }})</template></div>
  </template>
  <span v-else class="sub2">отзывов нет</span>
</template>
