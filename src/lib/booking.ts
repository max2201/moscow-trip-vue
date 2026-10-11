import type { Row, Stop } from './types'
import { tripLink } from './rows'

export const SOURCES: Record<string, { label: string; host: string }> = {
  ostrovok: { label: 'Островок', host: 'ostrovok.ru' },
  ozon: { label: 'Ozon Travel', host: 'ozon.ru' },
  yandex: { label: 'Яндекс Путешествия', host: 'travel.yandex.ru' },
  sutochno: { label: 'Суточно.ру', host: 'sutochno.ru' },
  tvil: { label: 'Твил', host: 'tvil.ru' },
  '101hotels': { label: '101Hotels', host: '101hotels.com' },
  avito: { label: 'Авито посуточно', host: 'avito.ru' },
  cian: { label: 'Циан посуточно', host: 'cian.ru' },
  kvartirka: { label: 'Квартирка', host: 'kvartirka.com' },
  tutu: { label: 'Туту', host: 'hotel.tutu.ru' },
  onetwotrip: { label: 'OneTwoTrip', host: 'onetwotrip.com' },
  bronevik: { label: 'Броневик', host: 'bronevik.com' },
  mts: { label: 'МТС Travel', host: 'travel.mts.ru' },
}
export const sourceLabel = (source = 'ostrovok') => SOURCES[source]?.label || source
export function bookingLink(r: Row, stop: Stop): string | undefined {
  const source = r.source || 'ostrovok'
  if (source === 'ostrovok') return tripLink(r.id, stop, r.o)
  if (!r.url || !SOURCES[source]) return undefined
  try {
    const url = new URL(r.url), host = SOURCES[source]!.host
    return url.protocol === 'https:' && !url.username && !url.password && (!url.port || url.port === '443') && (url.hostname === host || url.hostname.endsWith(`.${host}`)) ? url.href : undefined
  } catch { return undefined }
}
export const cancellationText = (free: boolean | null) => free === null ? 'Уточнить условия' : free ? 'Бесплатная' : 'Платная'
export function collectedText(stamp?: string | null) {
  if (!stamp) return ''
  const date = new Date(stamp)
  return Number.isFinite(date.getTime()) ? date.toLocaleString('ru-RU', {timeZone: 'Europe/Moscow', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'}) + ' мск' : ''
}
