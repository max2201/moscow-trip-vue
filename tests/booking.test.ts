import assert from 'node:assert/strict'
import { buildRows, brief } from '../src/lib/rows'
import { bookingLink, cancellationText } from '../src/lib/booking'
import { defaultFilters, encodeFilters, decodeFilters, applyFilters } from '../src/lib/filters'
import type { Hotel, Stop, Prices } from '../src/lib/types'

const stop = { id: 'm1', ci: '2026-10-14', co: '2026-10-22', nights: 8, totalLimit: 40000,
  alat: 55.75393, alng: 37.62079, prio: ['Тверской'], anchor: 1, proposed: 1 } as Stop
const template = { nm: 'Test', cat: 'Отель', an: 0, cp: null, ro: 0, at: 0, sm: 0, dm: 0, ins: 0,
  la: null, ln: null, rv: 10, pr: [], co: [], am: [], source: 'ozon', sourceKm: 2, z: 'Другие районы' }
const hotels = [1,2,3,4,5].map(id => ({...template,id})) as Hotel[]
const prices: Prices = {
  '1': [5000, 40000.01, null, '', 0, 0, 0], // even plan hotels must obey cap
  '2': [5000, 40000, null, '', 0, 0, 0, 0, {source:'ozon',distanceBasis:'source'}],
  '3': [1, null, 1, '', 0, 0, 0], // legacy per-night fallback
  '4': [null, null, null, '', 0, 0, 0],
  '5': [100, 30000, null, '', 0, 0, 0, 0, {source:'yandex'}],
}
const {rows} = buildRows(stop,hotels,prices)
assert.deepEqual(rows.map(r=>r.id).sort((a,b)=>a-b),[2,3,5])
const budgetRow = rows.find(r=>r.id===2)!
assert.ok(Number.isFinite(budgetRow.my))
assert.equal(brief(budgetRow,stop).reputation,'unread')
assert.equal(budgetRow.free,null)
assert.equal(cancellationText(null),'Уточнить условия')
const filters = defaultFilters(stop)
const marks = {mine:()=>0 as const,anyPlus:()=>false}
assert.equal(applyFilters(rows,filters,marks).length,3) // additional sources visible without district metadata
filters.sources=['ozon']; filters.sort='night'; filters.dir=1
assert.deepEqual(applyFilters(rows,filters,marks).map(r=>r.id),[3,2])
assert.deepEqual(decodeFilters(encodeFilters(filters,stop),stop).sources,['ozon'])
const r=budgetRow
assert.equal(bookingLink({...r,url:'https://www.ozon.ru/travel/hotels/product/h/?checkIn=2026-10-14'},stop)?.startsWith('https://www.ozon.ru/'),true)
for(const url of ['javascript:alert(1)','https://ozon.ru.evil.com/','https://user:secret@www.ozon.ru/']) assert.equal(bookingLink({...r,url},stop),undefined)
console.log('Booking budget, provider links, cancellation, filters and sorting: passed')
