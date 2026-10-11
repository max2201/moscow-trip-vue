<script setup lang="ts">
import type { Row } from '../lib/types'
defineProps<{ row: Row }>()
</script>
<template>
  <div class="housing-facts">
    <span :title="row.housing.evidence.bathtub || 'В данных выбранного предложения нет подтверждения'"><b>Ванна:</b> {{ row.housing.bathtub == null ? 'неизвестно' : row.housing.bathtub ? 'есть' : 'нет' }}</span>
    <span :title="row.housing.evidence.rooms || 'Количество жилых комнат не указано'"><b>Комнаты:</b> {{ row.housing.rooms == null ? 'неизвестно' : row.housing.rooms === 0 ? 'студия' : row.housing.rooms }}</span>
    <span :title="row.housing.evidence.duplex || 'Количество уровней не указано'"><b>Два уровня:</b> {{ row.housing.duplex == null ? 'неизвестно' : row.housing.duplex ? 'да' : 'нет' }}</span>
  </div>
  <details :class="['review-fit', row.reviewFit.state]">
    <summary>По отзывам: {{ row.reviewFit.state === 'ok' ? 'можно рассматривать' : row.reviewFit.state === 'concerns' ? 'есть сомнения' : 'недостаточно данных' }}</summary>
    <p v-for="reason in row.reviewFit.reasons" :key="reason">{{ reason }}</p>
  </details>
</template>
