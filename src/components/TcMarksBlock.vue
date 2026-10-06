<script setup lang="ts">
import type { TcMarks } from '../lib/types'
import { awardText, awardTitle, medalText, medalTitle, promoText, reviewText } from '../lib/tcmarks'
defineProps<{ tc: TcMarks | null; quiet?: boolean }>()
</script>

<!-- Отметки самого trip.com: рейтинг, значок партнёра, «новый / после ремонта», реклама, акции, выводы из отзывов. -->
<template>
  <div v-if="tc" class="tcm">
    <div v-if="tc.a || tc.m || tc.n?.length || tc.ad" class="tcchips">
      <span v-if="tc.a" class="tcc tc-award" :title="awardTitle(tc.a)">{{ awardText(tc.a) }}</span>
      <span v-if="tc.m" class="tcc tc-partner" :title="medalTitle(tc.m)">{{ medalText(tc.m) }}</span>
      <span v-for="n in tc.n ?? []" :key="n" class="tcc tc-new">{{ n }}</span>
      <span v-if="tc.ad" class="tcc tc-ad" title="Отель оплатил место в выдаче trip.com">реклама</span>
    </div>
    <div v-if="tc.p?.length || tc.d" class="tcline"><b>Акция:</b> {{ promoText(tc) }}</div>
    <div v-if="tc.r?.length" class="tcline"><b>В отзывах:</b> {{ reviewText(tc) }}</div>
  </div>
  <span v-else-if="!quiet" class="sub2">нет отметок</span>
</template>
