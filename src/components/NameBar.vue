<script setup lang="ts">
import { computed } from 'vue'
import { useMarks } from '../composables/useMarks'
const emit = defineEmits<{ who: [] }>()
const { store, version } = useMarks()
const state = computed(() => (version.value, store.mode === 'error' ? 'err' : store.mode === 'connecting' ? 'wait' : store.needName ? 'ask' : 'ok'))
</script>
<template>
  <div v-if="state === 'ask'" class="namebar ask"><b>Представьтесь, чтобы отмечать отели вместе с ребятами.</b> Имя увидят остальные рядом с вашими «+/−». <button class="who-ok" type="button" @click="emit('who')">Представиться</button></div>
  <div v-else-if="state === 'ok'" class="namebar ok">Вы отмечаете как <b>{{ store.myName }}</b>: ваши «+/−» видят все, у кого есть ссылка. <button class="link" type="button" @click="emit('who')">Сменить имя</button></div>
  <div v-else-if="state === 'err'" class="namebar err">Нет связи с общей базой отметок ({{ store.error }}). Отметки сохраняются только в этом браузере. Если вы в России, попробуйте открыть сайт через VPN.</div>
</template>
