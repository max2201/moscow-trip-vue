import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildRows } from '../src/lib/rows'
import { reviewFit } from '../src/lib/review-fit'
import { defaultFilters, passes, encodeFilters, decodeFilters, applyFilters } from '../src/lib/filters'
import type { Hotel, Stop, HousingFacts, Prices } from '../src/lib/types'

const stop = { id: 'm1', nights: 8, totalLimit: 40000, alat: 55.75393, alng: 37.62079, anchor: 1, proposed: 1, prio: [] } as Stop
const hotel = { id: 1, nm: 'Test', cat: 'Квартира', z: 'Москва', an: 100, rv: 120, sc: 8, ng: 15, ro: 0, sm: 2, dm: 2, ins: 0, at: 0, cp: null, am: [], pr: [], co: [], reviewRisks: { theft: 0, scam: 0, deposit: 0, booking: 0, rodents: 0, linen: 0, hotwater: 0, notrec: 0 } } as Hotel
assert.equal(reviewFit(hotel).state, 'ok')
for (const change of [{ sc: 7.9 }, { ng: 15.1 }, { ro: 1 }, { sm: 5, dm: 0 }, { reviewRisks: { booking: 2 } }, { reviewRisks: { linen: 5 } }]) {
  assert.equal(reviewFit({ ...hotel, ...change }).state, 'concerns')
}
for (const change of [{ an: 19 }, { an: 0, rv: 7709, sc: 9.8 }, { reviewRisks: undefined }, { ng: null }]) {
  assert.equal(reviewFit({ ...hotel, ...change }).state, 'unknown')
}
assert.equal(reviewFit({ ...hotel, reviewRisks: { booking: 1, linen: 4 } }).state, 'ok')
const facts: HousingFacts = { bathtub: true, rooms: 2, duplex: true, evidence: { rooms: 'Название номера: 2-комнатные апартаменты' } }
const prices: Prices = { 1: [4000, 32000, null, '2-комнатные апартаменты', 0, 0, 0, 0, { housing: facts }] }
const row = buildRows(stop, [hotel], prices).rows[0]!
assert.equal(row.housing.rooms, 2)
assert.equal(row.reviewFit.state, 'ok')
const f = defaultFilters(stop), marks = { mine: () => 0 as const, anyPlus: () => false }
f.reviews = 'ok'; f.bathtub = 'yes'; f.duplex = 'yes'; f.rooms = ['2']
assert.equal(passes(row, f, marks), true)
// Even plan rows must obey these selection criteria.
for (const change of [{ housing: { ...facts, bathtub: null } }, { housing: { ...facts, rooms: 1 } }, { housing: { ...facts, duplex: false } }, { reviewFit: { state: 'unknown' as const, reasons: [] } }]) {
  assert.equal(passes({ ...row, ...change }, f, marks), false)
}
assert.deepEqual(decodeFilters(encodeFilters(f, stop), stop), f)
const invalid = decodeFilters('{"rev":"safe","bath":"maybe","duplex":"bad","rooms":["5","garbage",true]}', stop)
assert.equal(invalid.reviews, ''); assert.equal(invalid.bathtub, ''); assert.equal(invalid.duplex, ''); assert.deepEqual(invalid.rooms, [])
f.reviews = ''; f.bathtub = 'unknown'; f.duplex = 'unknown'; f.rooms = ['unknown']
const unknown = buildRows(stop, [hotel], { 1: [4000, 32000, null, 'Standard', 0, 0, 0] }).rows[0]!
assert.equal(passes(unknown, f, marks), true)
f.bathtub = 'no'; assert.equal(passes(unknown, f, marks), false)
f.bathtub = ''; f.duplex = ''; f.rooms = ['4+']; assert.equal(passes({ ...row, housing: { ...facts, rooms: 5 } }, f, marks), true)
f.rooms = ['0']; assert.equal(passes({ ...row, housing: { ...facts, rooms: 0 } }, f, marks), true)

// Check real exported records as well as boundaries.
const index = JSON.parse(readFileSync(new URL('../public/data/index.json', import.meta.url), 'utf8'))
const actualStop = index.stops[0] as Stop
const hotels = JSON.parse(readFileSync(new URL('../public/data/cities/msk.json', import.meta.url), 'utf8')) as Hotel[]
const actualPrices = JSON.parse(readFileSync(new URL('../public/data/prices/m1.json', import.meta.url), 'utf8')) as Prices
const actualRows = buildRows(actualStop, hotels, actualPrices).rows
const actualFilters = defaultFilters(actualStop)
for (const [key, value] of [['reviews', 'ok'], ['bathtub', 'yes'], ['duplex', 'yes']] as const) {
  Object.assign(actualFilters, defaultFilters(actualStop), { [key]: value })
  const selected = applyFilters(actualRows, actualFilters, marks)
  assert.ok(selected.length > 0, `Expected known data for ${key}`)
  assert.ok(selected.every(r => key === 'reviews' ? r.reviewFit.state === 'ok' : r.housing[key] === true))
  console.log(`${key}: ${selected.length} matches in actual data`)
}
console.log('Housing facts, review selection, plan rows, unknowns and shareable filters: passed')
