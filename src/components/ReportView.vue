<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Report, RHotel } from '../lib/reports'
import { catBar, monthText } from '../lib/reports'
import { dec, dec1, fmt, kmText } from '../lib/format'

const props = defineProps<{ report: Report }>()
const tab = ref<'sum' | number>('sum')
const hotel = computed<RHotel | null>(() => (tab.value === 'sum' ? null : props.report.hotels.find((h) => h.id === tab.value) ?? null))
const made = computed(() => {
  const d = new Date(props.report.made)
  return isNaN(+d) ? '' : d.toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' })
})
const totalRead = computed(() => props.report.hotels.reduce((s, h) => s + (h.analyzed || 0), 0))
/** Строки сравнения с заголовками групп. */
const groups = computed(() => {
  const out: { group: string; rows: Report['compare'] }[] = []
  for (const r of props.report.compare) {
    const last = out[out.length - 1]
    if (last && last.group === r.group) last.rows.push(r)
    else out.push({ group: r.group, rows: [r] })
  }
  return out
})
function open(id: number) { tab.value = id; document.querySelector('.rp-body')?.scrollTo({ top: 0 }) }
const sign = (s: string) => (s === '+' ? 'хвалят' : s === '-' ? 'ругают' : 'по-разному')
</script>

<template>
  <div class="rp-report">
    <p class="rp-meta">Составлен {{ made }} · прочитано {{ fmt(totalRead) }} отзывов и карточки отелей на trip.com<template v-if="report.by"> · заказал {{ report.by }}</template></p>
    <div class="rp-tabs" role="tablist">
      <button type="button" role="tab" :aria-selected="tab === 'sum'" @click="tab = 'sum'">Сравнение</button>
      <button v-for="h in report.hotels" :key="h.id" type="button" role="tab" :aria-selected="tab === h.id" @click="open(h.id)">{{ h.name }}</button>
    </div>

    <section v-if="tab === 'sum'" class="rp-sum">
      <p v-for="(p, i) in report.summary" :key="i" class="rp-par">{{ p }}</p>
      <div v-if="report.picks.length" class="rp-picks">
        <div v-for="p in report.picks" :key="p.title" class="rp-pk"><b>{{ p.title }}</b><span>{{ p.text }}</span></div>
      </div>
      <div class="rp-cmpwrap">
        <table class="rp-cmp">
          <thead><tr><th></th><th v-for="c in report.cols" :key="c.id"><button type="button" class="link" @click="open(c.id)">{{ c.name }}</button></th></tr></thead>
          <tbody v-for="g in groups" :key="g.group">
            <tr class="rp-grp"><th :colspan="report.cols.length + 1">{{ g.group }}</th></tr>
            <tr v-for="r in g.rows" :key="r.label">
              <th scope="row">{{ r.label }}</th>
              <td v-for="(c, i) in r.cells" :key="i" :class="{ best: r.best?.includes(i) }">{{ c }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-else-if="hotel" class="rp-hotel">
      <div class="rp-hhead">
        <h3>{{ hotel.name }}<small v-if="hotel.stars"> {{ '★'.repeat(hotel.stars) }}</small></h3>
        <a v-if="hotel.url" :href="hotel.url" target="_blank" rel="noopener">открыть на trip.com ↗</a>
      </div>
      <p class="rp-facts">
        <span v-if="hotel.score">оценка trip.com <b>{{ dec(hotel.score) }}</b></span>
        <span v-if="hotel.recentAvg">за последний год <b>{{ dec(hotel.recentAvg) }}</b> ({{ hotel.recentN }} отз.)</span>
        <span>прочитано <b>{{ fmt(hotel.analyzed) }}</b> из {{ fmt(hotel.reviews) }} отзывов<template v-if="hotel.period">, {{ hotel.period }}</template></span>
        <span v-if="hotel.low != null">низких оценок (6 и ниже) {{ dec(hotel.low) }} %</span>
        <span v-if="hotel.night"><b>{{ fmt(hotel.night) }} ₽</b> за ночь</span>
        <span v-if="hotel.anchor">это «наш» отель</span><span v-else-if="hotel.km != null">{{ kmText(hotel.km) }} до «нашего»</span>
        <span v-if="hotel.open">открыт в {{ hotel.open }}<template v-if="hotel.renov">, ремонт {{ hotel.renov }}</template></span>
      </p>
      <p v-if="hotel.sub && Object.keys(hotel.sub).length" class="rp-subs"><span v-for="(v, k) in hotel.sub" :key="k">{{ k }} <b>{{ dec(v) }}</b></span></p>
      <p class="rp-verdict">{{ hotel.verdict }}</p>
      <div v-if="hotel.fit || hotel.unfit" class="rp-fit">
        <div v-if="hotel.fit"><b>Подойдёт</b>{{ hotel.fit }}</div>
        <div v-if="hotel.unfit"><b>Не подойдёт</b>{{ hotel.unfit }}</div>
      </div>
      <div class="rp-pc">
        <div><h4 class="good">Плюсы</h4><ul><li v-for="x in hotel.pros" :key="x">{{ x }}</li></ul></div>
        <div><h4 class="bad">Минусы и риски</h4><ul><li v-for="x in hotel.cons" :key="x">{{ x }}</li></ul></div>
      </div>

      <h4 class="rp-h">Что говорят гости — по темам</h4>
      <p class="rp-hint">Сколько отзывов упоминают тему и как: <i class="sw pos"></i>хвалят <i class="sw mix"></i>по-разному <i class="sw neg"></i>ругают. Нажмите на тему — подробности и цитаты.</p>
      <div class="rp-cats">
        <details v-for="c in hotel.cats" :key="c.key" class="rp-cat">
          <summary>
            <span class="rp-ct">{{ c.title }}</span>
            <span class="rp-cn">{{ fmt(c.n) }} отз. · {{ dec(c.share) }} %</span>
            <span class="rp-bar" :title="`хвалят ${c.pos}, по-разному ${c.mix}, ругают ${c.neg}`">
              <i class="pos" :style="{ width: catBar(c).pos + '%' }"></i><i class="mix" :style="{ width: catBar(c).mix + '%' }"></i><i class="neg" :style="{ width: catBar(c).neg + '%' }"></i>
            </span>
            <span class="rp-cy"><b class="good">+{{ c.pos }}</b> <b class="bad">−{{ c.neg }}</b><small v-if="c.rn"> · за год +{{ c.rpos }} −{{ c.rneg }}</small></span>
          </summary>
          <div class="rp-cbody">
            <div v-if="c.good.length"><h5 class="good">Хвалят</h5><ul><li v-for="x in c.good" :key="x">{{ x }}</li></ul></div>
            <div v-if="c.bad.length"><h5 class="bad">Ругают</h5><ul><li v-for="x in c.bad" :key="x">{{ x }}</li></ul></div>
            <blockquote v-for="(q, i) in c.quotes" :key="i" :class="'q' + (q.s === '+' ? 'p' : q.s === '-' ? 'n' : 'm')">
              «{{ q.t }}»<small>{{ sign(q.s) }}<template v-if="q.r"> · оценка {{ dec(q.r) }}/10</template><template v-if="q.d"> · {{ monthText(q.d) }}</template></small>
            </blockquote>
          </div>
        </details>
      </div>

      <div class="rp-secs">
        <section v-for="s in hotel.sections" :key="s.title" class="rp-sec">
          <h4>{{ s.title }}</h4>
          <p v-if="s.text">{{ s.text }}</p>
          <ul v-if="s.items?.length"><li v-for="x in s.items" :key="x">{{ x }}</li></ul>
        </section>
      </div>
      <p class="rp-foot">Средняя оценка прочитанных отзывов {{ dec1(hotel.avg ?? null) }}. Числа в скобках — сколько отзывов говорят об этом.</p>
    </section>
  </div>
</template>
