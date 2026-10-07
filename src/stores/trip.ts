import { defineStore } from 'pinia'
import { markRaw } from 'vue'
import type { CityId, Hotel, Prices, Stop, StopRows, TripIndex } from '../lib/types'
import { loadCity, loadIndex, loadPrices } from '../lib/data'
import { buildRows } from '../lib/rows'
import { marksStore } from '../lib/marks'
import { type Filters, decodeFilters } from '../lib/filters'

export const useTrip = defineStore('trip', {
  state: () => ({
    index: null as TripIndex | null,
    error: '' as string,
    hotels: {} as Partial<Record<CityId, Hotel[]>>,
    prices: {} as Record<string, Prices>,
    rows: {} as Record<string, StopRows>,
    filters: {} as Record<string, Filters>,
  }),
  getters: {
    stops: (s): Stop[] => s.index?.stops ?? [],
    stopById: (s) => (id: string) => s.index?.stops.find((x) => x.id === id),
  },
  actions: {
    async init() {
      try {
        this.index = markRaw(await loadIndex())
        marksStore.setMerges(Object.fromEntries(this.index.stops.filter((x) => x.merge?.length).map((x) => [x.id, x.merge!])))
      } catch (e) { this.error = String(e) }
    },
    /** Загружает отели города и цены остановки, считает строки один раз. */
    async ensureStop(stop: Stop) {
      if (this.rows[stop.id]) return
      const [hotels, prices] = await Promise.all([loadCity(stop.city), loadPrices(stop.id)])
      this.hotels[stop.city] = markRaw(hotels)
      this.prices[stop.id] = markRaw(prices)
      this.rows[stop.id] = markRaw(buildRows(stop, hotels, prices))
    },
    filtersFor(stop: Stop, fromUrl?: string | null): Filters {
      if (fromUrl !== undefined && fromUrl !== null) this.filters[stop.id] = decodeFilters(fromUrl, stop)
      if (!this.filters[stop.id]) this.filters[stop.id] = decodeFilters(null, stop)
      return this.filters[stop.id]
    },
  },
})
