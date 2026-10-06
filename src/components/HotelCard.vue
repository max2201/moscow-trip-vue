<script setup lang="ts">
import { computed } from 'vue'
import type { Row, Stop } from '../lib/types'
import { AMENITY, consList, tripLink } from '../lib/rows'
import { dec, dec1, fmt } from '../lib/format'
import MarkButton from './MarkButton.vue'
import ScoreChip from './ScoreChip.vue'
import BriefBlock from './BriefBlock.vue'
import FlagsBlock from './FlagsBlock.vue'
import Badges from './Badges.vue'
import TcMarksBlock from './TcMarksBlock.vue'
import { useMarks } from '../composables/useMarks'
const props = defineProps<{ r: Row; stop: Stop; selected: boolean }>()
const { store, version } = useMarks()
const mark = computed(() => (version.value, store.mine(props.stop.id, props.r.id)))
</script>

<template>
  <article :id="'c' + r.id" :class="['hcard', r.anchor ? 'anchor' : '', mark === 1 ? 'plus' : mark === -1 ? 'minus' : '', selected ? 'sel' : '']">
    <div class="hcard-top">
      <MarkButton :stop="stop.id" :id="r.id" />
      <div>
        <h3><a :href="tripLink(r.id, stop)" target="_blank" rel="noopener">{{ r.nm }}</a></h3>
        <div class="meta">#{{ r.rank }}, {{ r.z }}<template v-if="r.yr">, открыт в {{ r.yr }}</template></div>
        <Badges :row="r" :stop="stop" />
        <TcMarksBlock :tc="r.tc" quiet />
      </div>
      <ScoreChip :row="r" />
    </div>
    <div class="facts">
      <span><b>{{ r.night ? fmt(r.night) + ' ₽' : 'нет цены' }}</b> за ночь</span>
      <span :class="r.free ? 'free' : ''">{{ r.free ? 'бесплатная отмена' : 'отмена платная' }}</span>
      <span v-if="!r.anchor && r.km != null"><b>{{ dec(r.km.toFixed(2)) }} км</b> до «нашего»</span>
      <span>trip.com <b>{{ dec1(r.sc) }}</b> ({{ fmt(r.rv) }})</span>
    </div>
    <BriefBlock :row="r" :stop="stop" />
    <details>
      <summary>Подробнее: плюсы, минусы, флаги, удобства</summary>
      <div class="twocol">
        <ul class="pc pros"><li v-for="x in r.pr" :key="x">{{ x }}</li><li v-if="!r.pr.length" class="sub2">мало данных</li></ul>
        <ul class="pc cons"><li v-for="x in consList(r)" :key="x">{{ x }}</li></ul>
      </div>
      <FlagsBlock :row="r" />
      <div class="am" style="margin-top:8px;max-width:none"><span v-for="a in r.am" :key="a">{{ AMENITY[a] }}</span></div>
      <div class="meta" style="margin-top:6px">{{ r.room }}</div>
    </details>
  </article>
</template>
