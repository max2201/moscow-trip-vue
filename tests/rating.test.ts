import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { buildRows, partsTitle } from '../src/lib/rows'
import { ratingBasis, ratingEvidence } from '../src/lib/rating'
import { tooltipHtml } from '../src/lib/maplegend'
import { reviewFit } from '../src/lib/review-fit'
import { defaultFilters, passes, decodeFilters, encodeFilters } from '../src/lib/filters'
import type { Hotel, Stop, Prices } from '../src/lib/types'

const stop = { id:'m1', nights:8, totalLimit:40000, anchor:1, proposed:1, prio:[] } as Stop
const hotel = { id:2, nm:'Test', cat:'Отель', an:0, rv:1000, sc:9.5, cp:null, pr:[], co:[], am:[], ro:0, at:0, sm:0, dm:0, ins:0, ng:null } as Hotel
const prices: Prices = {2:[3000,24000,null,'',0,0,0]}
const rated = buildRows(stop,[hotel],prices).rows[0]!
assert.ok(rated.my! > 8)
assert.ok(rated.my! <= 9.5)
assert.equal(ratingBasis(rated),'platform')
assert.equal(reviewFit(rated).state,'preliminary')
assert.match(partsTitle(rated), /Тексты не разобраны/)
assert.match(tooltipHtml(rated,0,[]), /предварительная/)
const unrated = buildRows(stop,[{...hotel,sc:null,rv:0}],prices).rows[0]!
assert.ok(Number.isFinite(unrated.my))
assert.ok(unrated.my! < 8)
assert.equal(ratingBasis(unrated),'none')
assert.equal(reviewFit(unrated).state,'unknown')
assert.match(ratingEvidence(unrated), /не подтверждает качество/)
assert.equal(reviewFit({...hotel,an:1,reviewRisks:{scam:1}}).state,'concerns')
assert.equal(reviewFit({...hotel,sc:7.5}).state,'concerns')
const f=defaultFilters(stop), marks={mine:()=>0 as const,anyPlus:()=>false}
f.reviews='consider'; assert.equal(passes(rated,f,marks),true); assert.equal(passes(unrated,f,marks),false)
f.reviews='ok'; assert.equal(passes(rated,f,marks),false)
f.reviews='preliminary'; assert.deepEqual(decodeFilters(encodeFilters(f,stop),stop),f)
f.ranges.rmin=1000; assert.equal(passes(rated,f,marks),true)
f.ranges.rmin=1001; assert.equal(passes(rated,f,marks),false)
const index=JSON.parse(readFileSync(new URL('../public/data/index.json',import.meta.url),'utf8'))
const actual=buildRows(index.stops[0],JSON.parse(readFileSync(new URL('../public/data/cities/msk.json',import.meta.url),'utf8')),JSON.parse(readFileSync(new URL('../public/data/prices/m1.json',import.meta.url),'utf8'))).rows
assert.ok(actual.length>7000)
assert.ok(actual.every(r=>r.my!==null && Number.isFinite(r.my) && r.my>=0 && r.my<=10))
assert.ok(actual.every(r=>ratingBasis(r)!=='none' || r.reviewFit.state!=='ok'))
console.log('Every offer has a score; evidence, uncertainty, risk selection and real exported records: passed')
