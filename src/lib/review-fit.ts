import type { Hotel, ReviewFit } from './types'

export const REVIEW_CRITERIA = 'Не менее 20 разобранных текстов, оценка гостей от 8/10, негативных отзывов не больше 15%, без упоминаний тараканов/клопов, запах и сырость — меньше 5% текстов. Нет повторяющихся сигналов о краже, обмане, удержании залога, проблемах с бронью или грызунах; также учитываются частые жалобы на бельё и горячую воду и прямые рекомендации не заселяться. Остальные замечания остаются в карточке.'

export function reviewFit(h: Hotel): ReviewFit {
  if (!h.an || h.an < 20 || h.sc == null || h.ng == null || !h.reviewRisks) {
    return { state: 'unknown', reasons: [h.an === 0 ? 'Тексты отзывов ещё не разобраны' : 'Недостаточно данных для проверки всех критериев'] }
  }
  const reasons: string[] = []
  if (h.sc < 8) reasons.push('Оценка гостей ниже 8/10')
  if (h.ng > 15) reasons.push('Больше 15% негативных отзывов')
  if (h.ro > 0) reasons.push(`Тараканы или клопы: ${h.ro} упоминаний`)
  if ((h.sm + h.dm) / h.an >= .05) reasons.push('Запах и сырость: не менее 5% текстов')
  const risks = h.reviewRisks
  const severe = [['theft', 'Сообщения о кражах'], ['scam', 'Обман с деньгами'], ['deposit', 'Удержание залога или лишние списания'], ['booking', 'Проблемы с заселением по брони'], ['rodents', 'Сообщения о грызунах']] as const
  for (const [key, label] of severe) if ((risks[key] || 0) >= 2) reasons.push(`${label}: ${risks[key]} текстов`)
  for (const [key, label] of [['linen', 'Грязное бельё'], ['hotwater', 'Нет горячей воды'], ['notrec', 'Не рекомендуют заселяться']] as const) {
    if ((risks[key] || 0) >= 3 && (risks[key] || 0) / h.an >= .05) reasons.push(`${label}: не менее 5% текстов`)
  }
  return reasons.length ? { state: 'concerns', reasons } : { state: 'ok', reasons: [`Проверено ${h.an} текстов; оценка ${h.sc}/10, негативных ${h.ng}%. Пороговые сигналы не обнаружены. Это предварительный отбор, замечания смотрите в карточке.`] }
}
