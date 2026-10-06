import { onScopeDispose, shallowRef } from 'vue'
import { legendStore } from '../lib/maplegend'

/**
 * Состояние легенды карты (что выключено, радиус круга) — общее для карты и фильтров.
 * Та же схема, что у useMarks: внешнее хранилище + shallowRef, который обновляем по подписке.
 */
export function useLegend() {
  const legend = shallowRef(legendStore.get())
  const off = legendStore.subscribe(() => { legend.value = legendStore.get() })
  onScopeDispose(off)
  return { legend, setLegend: legendStore.set }
}
