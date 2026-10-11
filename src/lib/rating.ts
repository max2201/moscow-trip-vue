import type { Hotel } from './types'
import { sourceLabel } from './booking'

export function ratingBasis(h: Hotel): 'texts' | 'platform' | 'none' {
  return h.rating?.basis ?? (h.an > 0 ? 'texts' : h.sc != null && h.sc > 0 ? 'platform' : 'none')
}
export function ratingLabel(h: Hotel) {
  const basis = ratingBasis(h)
  return basis === 'none' ? 'условная' : basis === 'platform' || h.an < 20 ? 'предварительная' : 'разбор отзывов'
}
export function ratingEvidence(h: Hotel) {
  const source = sourceLabel(h.reviewSource || h.source)
  switch (ratingBasis(h)) {
    case 'texts': return `${source}: разобрано ${h.an} текстов${h.rv ? ' из ' + h.rv + ' опубликованных' : '; общее число отзывов неизвестно'}.${h.rating?.scoreBasis === 'sample' ? ' Оценка гостей — средняя прочитанной выборки, рейтинг всего объекта не опубликован в снимке.' : ''}${h.reviewCoverage && !h.reviewCoverage.complete ? ' Доступна выборка, весь архив не прочитан.' : ''}${h.an < 20 ? ' Мало текстов, вывод предварительный.' : ''}`
    case 'platform': return `${source}: оценка гостей ${h.sc}/10; ${h.rv ? h.rv + ' опубликованных отзывов' : 'число отзывов неизвестно'}. Тексты не разобраны: скрытые жалобы не проверены. Предварительный балл ограничен 9,5.`
    case 'none': return 'Нет оценки гостей и текстов. Условная основа 6/10 нужна для сортировки; она не подтверждает качество жилья.'
  }
}

/** Old offline snapshots also receive a candid preliminary ranking. */
export function fallbackComponents(h: Hotel): [number, number, number, number, number] {
  if (h.sc == null || !Number.isFinite(h.sc) || h.sc <= 0 || h.sc > 10) return [6, 0, 0, 0, 0]
  const count = Math.min(Math.max(h.rv || 0, 0), 1000) || 5
  return [(count * h.sc + 25 * 8) / (count + 25), 0, 0, 0, -.15 - (h.rv < 15 ? .3 : 0)]
}
