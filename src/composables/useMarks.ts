import { onScopeDispose, shallowRef } from 'vue'
import { marksStore } from '../lib/marks'

/**
 * Связка внешнего хранилища с реактивностью Vue: при каждом изменении
 * увеличиваем version, а компоненты читают его в computed — и пересчитываются.
 * (В React-версии то же самое делает useSyncExternalStore.)
 */
export function useMarks() {
  const version = shallowRef(marksStore.version)
  const off = marksStore.subscribe(() => { version.value = marksStore.version })
  onScopeDispose(off)
  return { store: marksStore, version }
}
