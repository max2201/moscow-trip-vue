<script setup lang="ts">
import { computed } from 'vue'
import { useTrip } from '../stores/trip'
import { collectedText } from '../lib/booking'
import type { Stop } from '../lib/types'
const props = defineProps<{ stop: Stop }>()
const trip = useTrip()
const sources = computed(() => trip.index?.sources?.[props.stop.id] || [])
const stateText = (state: string, count: number) => state === 'error' ? count ? 'сохранён прошлый снимок' : 'обновление не удалось' : state === 'manual' ? 'нужен импорт' : count ? 'есть предложения' : 'сбор не подключён'
</script>

<template>
  <details v-if="sources.length" class="source-panel">
    <summary>Площадки бронирования · {{ sources.filter(s => s.count > 0).length }} с данными из {{ sources.length }}</summary>
    <p class="meta">До {{ (stop.totalLimit ?? 40000).toLocaleString('ru-RU') }} ₽ за все {{ stop.nights }} ночей для двоих. В таблицу попадают только предложения с подтверждённой суммой на эти даты. Один объект на разных площадках может встречаться несколько раз.</p>
    <div class="source-grid">
      <article v-for="source in sources" :key="source.id">
        <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.label }} ↗</a>
        <div class="meta">{{ stateText(source.state, source.count) }}<template v-if="source.count"> · {{ source.count }} в снимке</template></div>
        <div v-if="source.collectedAt" class="meta">Снято {{ collectedText(source.collectedAt) }}<template v-if="source.mode === 'manual'"> · ручной снимок</template></div>
        <div v-if="source.count && !source.complete" class="meta">Часть выдачи; полный охват не подтверждён</div>
        <div class="meta">{{ source.automatic ? 'Настроена ежедневная попытка обновления' : 'Автоматический сбор не подключён' }}</div>
        <div v-if="source.message" class="meta">{{ source.message }}</div>
        <div v-if="!source.count" class="meta">На площадке проверьте 14–22 октября, 2 гостей и сумму до 40 000 ₽.</div>
      </article>
    </div>
  </details>
</template>

<style scoped>
.source-panel { margin: 12px 0; padding: 14px 18px; border: 1px solid var(--line, #dce0e5); border-radius: 12px; background: var(--card, #fff); }
summary { cursor: pointer; font-weight: 600; }
.source-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px, 1fr)); gap: 14px; margin-top: 14px; }
.source-grid article { border-top: 1px solid var(--line, #dce0e5); padding-top: 10px; }
</style>
