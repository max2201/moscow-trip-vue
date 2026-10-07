<script setup lang="ts">
import type { Row, Stop } from '../lib/types'
import { AMENITY, consList, tripLink } from '../lib/rows'
import { dec, dec1, fmt } from '../lib/format'
import MarkButton from './MarkButton.vue'
import ScoreChip from './ScoreChip.vue'
import SubBar from './SubBar.vue'
import BriefBlock from './BriefBlock.vue'
import FlagsBlock from './FlagsBlock.vue'
import Badges from './Badges.vue'
import TcMarksBlock from './TcMarksBlock.vue'
defineProps<{ r: Row; stop: Stop; left: number[] }>()
</script>

<!-- Ячейки одной строки: фрагмент из 23 <td>, строку <tr> рисует родитель. -->
<template>
  <td class="sticky mkc" :style="{ left: left[0] + 'px' }"><MarkButton :stop="stop.id" :id="r.id" /></td>
  <td class="sticky rank" :style="{ left: left[1] + 'px' }">{{ r.rank }}</td>
  <td class="sticky name" :style="{ left: left[2] + 'px' }">
    <a :href="tripLink(r.id, stop)" target="_blank" rel="noopener" @click.stop>{{ r.nm }}</a>
    <div class="meta">{{ r.z }}<template v-if="r.yr">, открыт в {{ r.yr }}</template></div>
    <Badges :row="r" :stop="stop" />
    <div class="meta">{{ r.room }}</div>
    <div v-if="r.anchor" class="meta">{{ stop.anchor === stop.proposed ? 'ваш отель по плану' : 'отель ребят по плану' }} на {{ stop.days }} — от него считаются расстояния</div>
  </td>
  <td><ScoreChip :row="r" /></td>
  <td class="num"><b>{{ r.night ? fmt(r.night) + ' ₽' : 'нет цены' }}</b><div class="sub2">{{ r.total ? fmt(r.total) + ' ₽' : '' }}</div></td>
  <td :class="r.free ? 'free' : 'sub2'">{{ r.free ? 'Бесплатная' : 'Платная' }}</td>
  <td class="num"><b v-if="r.anchor" style="color:var(--accent)">это он</b><template v-else>{{ r.km == null ? '—' : dec(r.km.toFixed(2)) + ' км' }}</template></td>
  <td><BriefBlock :row="r" :stop="stop" /></td>
  <td><ul class="pc pros"><li v-for="x in r.pr" :key="x">{{ x }}</li><li v-if="!r.pr.length" class="sub2">мало данных</li></ul></td>
  <td><ul class="pc cons"><li v-for="x in consList(r)" :key="x">{{ x }}</li></ul></td>
  <td><FlagsBlock :row="r" /></td>
  <td class="num"><b>{{ dec1(r.sc) }}</b><div class="sub2">{{ fmt(r.rv) }} отзывов</div></td>
  <td><TcMarksBlock :tc="r.tc" /></td>
  <td><SubBar :v="r.cl" /></td>
  <td><SubBar :v="r.fa" /></td>
  <td><SubBar :v="r.lo" /></td>
  <td><SubBar :v="r.se" /></td>
  <td>
    <div class="am"><span v-for="a in r.am" :key="a">{{ AMENITY[a] }}</span><span v-if="!r.am.length" style="background:none;color:var(--muted);padding:0">почти ничего</span></div>
    <div class="sub2" style="margin-top:4px">всего {{ r.amn }}</div>
  </td>
  <td style="white-space:nowrap;font-size:13px">{{ r.tg }}<div v-if="r.cat && r.cat !== 'Отель' && r.cat !== r.tg" class="sub2">{{ r.cat }}</div><div style="color:var(--warn)">{{ r.st ? '★'.repeat(r.st) : '' }}<span v-if="!r.st" class="sub2">без звёзд</span></div></td>
  <td class="num">{{ r.yr || '—' }}</td>
  <td class="num">{{ r.ry || '—' }}</td>
  <td class="num">{{ r.ng == null ? '—' : dec(r.ng) + '%' }}</td>
  <td class="num">{{ r.ns == null ? '—' : dec(r.ns) + '%' }}</td>
</template>
