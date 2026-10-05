<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useMarks } from '../composables/useMarks'
const emit = defineEmits<{ close: [] }>()
const { store, version } = useMarks()
const name = ref(store.myName || '')
const input = ref<HTMLInputElement | null>(null)
const known = computed(() => (version.value, store.knownNames()))
const had = !!store.myName
function done(v: string) { v = v.trim(); if (!v) { input.value?.focus(); return } store.setName(v); emit('close') }
const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') emit('close') }
onMounted(() => { document.addEventListener('keydown', esc); setTimeout(() => input.value?.focus(), 30) })
onBeforeUnmount(() => document.removeEventListener('keydown', esc))
</script>
<template>
  <div class="who-overlay" @click.self="emit('close')">
    <div class="who-dialog" role="dialog" aria-modal="true" aria-labelledby="whotitle">
      <h2 id="whotitle">Кто вы?</h2>
      <p>Имя подпишет ваши отметки «+/−», его увидят остальные. Запомнится в этом браузере.</p>
      <div v-if="known.length" class="who-known"><span>Уже отмечали:</span><button v-for="n in known" :key="n" type="button" class="who-pick" @click="done(n)">Я — {{ n }}</button></div>
      <label class="who-field"><span>Ваше имя</span><input ref="input" v-model="name" maxlength="30" autocomplete="given-name" placeholder="Например, Максим" @keydown.enter="done(name)"></label>
      <div class="who-actions"><button class="who-ok" type="button" @click="done(name)">Готово</button><button class="link" type="button" @click="emit('close')">{{ had ? 'Отмена' : 'Пока без имени' }}</button></div>
      <p v-if="!had" class="who-note">Без имени отметки сохраняются только в этом браузере, и никто их не видит.</p>
    </div>
  </div>
</template>
