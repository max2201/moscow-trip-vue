<script setup lang="ts">
import { computed } from 'vue'
import type { Row, Stop } from '../lib/types'
import { brief } from '../lib/rows'
const props = defineProps<{ row: Row; stop: Stop }>()
const b = computed(() => brief(props.row, props.stop))
</script>
<template>
  <div class="brief">
    <p v-if="b.known.length"><b class="bk-good">Чем известен:</b> {{ b.known.join('; ') }}.</p>
    <p v-if="b.warn.length"><b class="bk-bad">Осторожно:</b> {{ b.warn.join('; ') }}.</p>
    <p v-else-if="b.reputation === 'ok'"><b class="bk-good">Репутация:</b> серьёзных проблем в отзывах не видно.</p>
    <p v-else><b class="bk-muted">Репутация:</b> отзывов мало, она ещё не сложилась.</p>
    <p><b class="bk-muted">Где:</b> {{ b.where }}. {{ b.anchorLine }}</p>
  </div>
</template>
