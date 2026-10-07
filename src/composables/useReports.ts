import { onScopeDispose, shallowRef, watch } from 'vue'
import { reportsStore } from '../lib/reports'

/**
 * Заявки на отчёты по остановке: подписка на общее хранилище (как useMarks) и слежение
 * за остановкой, пока компонент на экране. stopId — геттер, чтобы смена остановки переключала подписку.
 */
export function useReports(stopId: () => string) {
  const version = shallowRef(reportsStore.version)
  const off = reportsStore.subscribe(() => { version.value = reportsStore.version })
  let unwatch: (() => void) | null = null
  watch(stopId, (id) => { unwatch?.(); unwatch = reportsStore.watch(id) }, { immediate: true })
  onScopeDispose(() => { off(); unwatch?.() })
  return { reports: reportsStore, rversion: version }
}
