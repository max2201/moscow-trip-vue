<script setup lang="ts">
import { bookingLink, sourceLabel, cancellationText, collectedText } from '../lib/booking'
import type { Row, Stop } from '../lib/types'
import { AMENITY, consList } from '../lib/rows'
import { dec, dec1, fmt } from '../lib/format'
import MarkButton from './MarkButton.vue'
import ScoreChip from './ScoreChip.vue'
import SubBar from './SubBar.vue'
import BriefBlock from './BriefBlock.vue'
import FlagsBlock from './FlagsBlock.vue'
import Badges from './Badges.vue'
import HousingFacts from './HousingFacts.vue'
import { hoverHotel } from '../lib/hover'
defineProps<{ r: Row; stop: Stop; rowPinned?: boolean }>()
const emit = defineEmits<{ pin: [] }>()
</script>

<!-- Ячейки одной строки: фрагмент из 20 <td>, строку <tr> рисует родитель. -->
<template>
  <td class="mkc"><MarkButton :stop="stop.id" :id="r.id" /></td>
  <td class="rank">{{ r.rank }}<button type="button" class="rpin" :aria-pressed="!!rowPinned" :title="rowPinned ? 'Открепить строку' : 'Закрепить строку: останется сверху таблицы при прокрутке и при любых фильтрах'"
      :aria-label="(rowPinned ? 'Открепить' : 'Закрепить') + ' строку «' + r.nm + '»'" @click.stop="emit('pin')"><svg viewBox="0 0 16 16" aria-hidden="true"><path d="M6 1.5h4l-.6 4.2 2.6 2.3v1.3H8.7V15L8 15.8 7.3 15V9.3H4V8l2.6-2.3z"/></svg></button></td>
  <td class="name" @mouseenter="hoverHotel.set(r.id)" @mouseleave="hoverHotel.set(null)">
    <a :href="bookingLink(r, stop)" target="_blank" rel="noopener" @click.stop>{{ r.nm }}</a>
    <div class="meta">{{ r.z }}<template v-if="r.yr">, открыт в {{ r.yr }}</template></div>
    <Badges :row="r" :stop="stop" />
    <div class="meta">{{ r.room }}</div><div class="meta">{{ sourceLabel(r.source) }}<template v-if="r.collectedAt"> · {{ collectedText(r.collectedAt) }}</template></div>
    <HousingFacts :row="r" />
    <div v-if="r.anchor" class="meta">{{ stop.anchor === stop.proposed ? 'ваш отель по плану' : 'отель ребят по плану' }} на {{ stop.days }} — от него считаются расстояния</div>
  </td>
  <td><ScoreChip :row="r" /></td>
  <td class="num"><b>{{ r.total ? fmt(r.total) + ' ₽' : 'нет цены' }}</b><div class="sub2">за {{ stop.nights }} ночей</div><div class="sub2">{{ r.night ? fmt(r.night) + ' ₽ / ночь' : '' }}</div></td>
  <td :class="r.free ? 'free' : 'sub2'">{{ cancellationText(r.free) }}</td>
  <td class="num"><b v-if="r.anchor" style="color:var(--accent)">это он</b><template v-else>{{ r.km == null ? '—' : dec(r.km.toFixed(2)) + ' км' }}<div v-if="r.distanceBasis === 'source' && r.km != null" class="meta">до центра по площадке</div></template></td>
  <td><BriefBlock :row="r" :stop="stop" /></td>
  <td><ul class="pc pros"><li v-for="x in r.pr" :key="x">{{ x }}</li><li v-if="!r.pr.length" class="sub2">мало данных</li></ul></td>
  <td><ul class="pc cons"><li v-for="x in consList(r)" :key="x">{{ x }}</li></ul></td>
  <td><FlagsBlock :row="r" /></td>
  <td class="num"><b>{{ dec1(r.sc) }}</b><div class="meta">{{ sourceLabel(r.reviewSource || r.source) }} · {{ r.rating?.scoreBasis === 'sample' ? 'средняя прочитанных текстов' : '10-балльная шкала' }}</div><div class="sub2">{{ r.rv ? fmt(r.rv) + ' отзывов' : 'число отзывов неизвестно' }}</div></td>
  <td><SubBar :v="r.cl" /></td>
  <td><SubBar :v="r.fa" /></td>
  <td><SubBar :v="r.lo" /></td>
  <td><SubBar :v="r.se" /></td>
  <td>
    <div class="am"><span v-for="a in r.am" :key="a">{{ AMENITY[a] }}</span><span v-if="!r.am.length" style="background:none;color:var(--muted);padding:0">почти ничего</span></div>
    <div class="sub2" style="margin-top:4px">всего {{ r.amn }}</div>
  </td>
  <td style="white-space:nowrap;font-size:13px">{{ r.tg }}<div v-if="r.cat && r.cat !== 'Отель' && r.cat !== r.tg" class="sub2">{{ r.cat }}</div><div style="color:var(--warn)">{{ r.st ? '★'.repeat(r.st) : '' }}<span v-if="!r.st" class="sub2">без звёзд</span></div></td>
  <td class="num">{{ r.ng == null ? '—' : dec(r.ng) + '%' }}</td>
  <td class="num">{{ r.ns == null ? '—' : dec(r.ns) + '%' }}</td>
</template>
