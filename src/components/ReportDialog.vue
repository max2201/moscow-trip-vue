<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { Row, Stop } from '../lib/types'
import { DUTY_TEXT, errorText, isOpen, onDuty, statusText, whenText, type ReportDoc } from '../lib/reports'
import { plural } from '../lib/format'
import { useReports } from '../composables/useReports'
import { useMarks } from '../composables/useMarks'
import ReportView from './ReportView.vue'

const props = defineProps<{ stop: Stop; rows: Row[]; openId?: string | null }>()
const emit = defineEmits<{ close: [] }>()
const { reports, rversion } = useReports(() => props.stop.id)
const { store, version } = useMarks()

// Мои плюсы на этой остановке + «наш» отель для сравнения (по умолчанию не выбран, если он не в плюсах).
const plus = computed(() => (version.value, props.rows.filter((r) => store.mine(props.stop.id, r.id) === 1)))
const choices = computed(() => {
  const a = props.rows.find((r) => r.anchor)
  return a && !plus.value.some((r) => r.id === a.id) ? [...plus.value, a] : plus.value
})
const off = ref<Set<number>>(new Set(props.rows.filter((r) => r.anchor && store.mine(props.stop.id, r.id) !== 1).map((r) => r.id)))
const picked = computed(() => choices.value.filter((r) => !off.value.has(r.id)).map((r) => r.id))
function toggle(id: number) { const s = new Set(off.value); if (s.has(id)) s.delete(id); else s.add(id); off.value = s }

const docs = computed(() => (rversion.value, reports.docs))
const state = computed(() => (rversion.value, reports.state))
const same = computed(() => (rversion.value, version.value, store.myName ? reports.findSame(picked.value, store.myName) : null))
const current = ref<string | null>(props.openId ?? null)
const doc = computed<ReportDoc | null>(() => docs.value.find((d) => d.id === current.value) ?? null)
const report = computed(() => (rversion.value, doc.value ? reports.report(doc.value) : null)) // rversion: сжатый отчёт распаковывается в фоне
const names = (d: ReportDoc) => d.hotels.map((id) => props.rows.find((r) => r.id === id)?.nm ?? `#${id}`)

const name = ref('')
const sending = ref(false)
const sendErr = ref('')
const canSend = computed(() => (version.value, store.mode === 'shared' && !store.needName && picked.value.length > 0 && !sending.value))
async function send() {
  if (!canSend.value || !store.myName) return
  sending.value = true; sendErr.value = ''
  try { current.value = await reports.request(props.stop.id, picked.value, store.myName) }
  catch (e) { sendErr.value = errorText((e as { code?: string }).code || String(e)) }
  finally { sending.value = false }
}
async function cancel(d: ReportDoc) {
  try { await reports.cancel(d.id); if (current.value === d.id) current.value = null }
  catch (e) { sendErr.value = errorText((e as { code?: string }).code || String(e)) }
}
function saveName() { if (name.value.trim()) store.setName(name.value) }

const esc = (e: KeyboardEvent) => { if (e.key !== 'Escape') return; if (current.value) current.value = null; else emit('close') }
onMounted(() => { document.addEventListener('keydown', esc); document.body.classList.add('modal-open') })
onBeforeUnmount(() => { document.removeEventListener('keydown', esc); document.body.classList.remove('modal-open') })
</script>

<template>
  <div class="who-overlay rp-overlay" @click.self="emit('close')">
    <div class="rp-dialog" role="dialog" aria-modal="true" aria-labelledby="rptitle">
      <header class="rp-top">
        <button v-if="current" type="button" class="link rp-back" @click="current = null">← все отчёты</button>
        <h2 id="rptitle">{{ report ? `Отчёт: ${report.title}` : `Подробные отчёты · ${stop.title}` }}</h2>
        <button type="button" class="rp-x" aria-label="Закрыть" @click="emit('close')">×</button>
      </header>

      <div class="rp-body">
        <ReportView v-if="report" :report="report" />

        <div v-else-if="doc" class="rp-wait">
          <p class="rp-status" :class="doc.status"><b>Отчёт {{ statusText(doc.status) }}</b><template v-if="doc.prog"> — {{ doc.prog }}</template></p>
          <p v-if="doc.status === 'error'" class="rp-err">{{ doc.err || 'Что-то пошло не так.' }}</p>
          <p v-if="doc.status === 'queued' && !onDuty()" class="rp-note">Сейчас ночь: заявку возьмут в работу после 8:00 по времени Таиланда.</p>
          <p v-else-if="doc.status === 'queued'" class="rp-note">Заявку возьмут в работу в течение минуты.</p>
          <p class="rp-note">{{ names(doc).join(', ') }}</p>
          <p class="rp-note">{{ DUTY_TEXT }}</p>
          <button v-if="doc.status === 'queued' && doc.name === store.myName" type="button" class="link" @click="cancel(doc)">отменить заявку</button>
        </div>

        <template v-else>
          <section class="rp-new">
            <h3>Новый отчёт по моим плюсам</h3>
            <p class="rp-note">Claude прочитает <b>все</b> отзывы этих отелей на trip.com и их карточки и разложит, что говорят люди, по темам с цитатами. Он сравнит удобства, завтраки, бассейны, спортзалы и номера, отметит фишки и риски и напишет общий вывод.</p>
            <div v-if="store.needName" class="rp-name">
              <span>Чтобы заказать отчёт, представьтесь:</span>
              <input v-model="name" maxlength="30" placeholder="Ваше имя" @keydown.enter="saveName">
              <button type="button" class="who-ok" @click="saveName">Готово</button>
            </div>
            <p v-if="!choices.length" class="rp-empty">На этой остановке у вас пока нет отелей с плюсом. Отметьте понравившиеся «+» в таблице — и возвращайтесь.</p>
            <ul v-else class="rp-pick">
              <li v-for="r in choices" :key="r.id">
                <label><input type="checkbox" :checked="!off.has(r.id)" @change="toggle(r.id)">
                  <span>{{ r.nm }}</span><small>{{ [r.anchor ? '«наш» отель' : '', store.mine(stop.id, r.id) === 1 ? 'ваш плюс' : ''].filter(Boolean).join(', ') }}<template v-if="r.rv"> · {{ r.rv }} отз.</template></small></label>
              </li>
            </ul>
            <div v-if="same && isOpen(same)" class="rp-same">По этим отелям отчёт уже {{ statusText(same.status) }}. <button type="button" class="link" @click="current = same.id">Посмотреть</button></div>
            <div v-else class="rp-actions">
              <button type="button" class="who-ok" :disabled="!canSend" @click="send">{{ sending ? 'Отправляю…' : `Заказать отчёт · ${picked.length} ${plural(picked.length, 'отель', 'отеля', 'отелей')}` }}</button>
              <span v-if="same" class="rp-note">Отчёт по этим отелям уже есть — от {{ whenText(same.t) }}. <button type="button" class="link" @click="current = same.id">Открыть</button></span>
            </div>
            <p v-if="sendErr" class="rp-err">{{ sendErr }}</p>
            <p v-if="store.mode === 'error'" class="rp-err">{{ errorText(store.error) }}</p>
            <p class="rp-note small">{{ DUTY_TEXT }}</p>
          </section>

          <section class="rp-list">
            <h3>Отчёты по этой остановке</h3>
            <p v-if="state === 'loading'" class="rp-note">Загружаю…</p>
            <p v-else-if="state === 'error'" class="rp-err">{{ errorText(reports.error) }}</p>
            <p v-else-if="!docs.length" class="rp-note">Пока ни одного.</p>
            <ul v-else>
              <li v-for="d in docs" :key="d.id">
                <button type="button" class="rp-item" @click="current = d.id">
                  <span class="rp-when">{{ whenText(d.t) }} · {{ d.name || 'кто-то' }}</span>
                  <span class="rp-hs">{{ names(d).join(', ') }}</span>
                  <span :class="['rp-chip', d.status]">{{ statusText(d.status) }}<template v-if="isOpen(d) && d.prog"> · {{ d.prog }}</template></span>
                </button>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>
