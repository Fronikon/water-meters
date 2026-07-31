import { types, getParent } from 'mobx-state-tree';
import type { Instance } from 'mobx-state-tree';
import type {
  RawMeter,
  RawArea,
  TMeterType,
  TMeterTypeLabel,
} from '../types/meters.ts';
import { toMeterTypeLabel, getInitialValue } from '../types/meters.ts';

// ============================================================
// AreaModel — адрес из кэша
// ============================================================

export const AreaModel = types.model('AreaModel', {
  id: types.identifier,
  number: types.number,
  str_number: types.string,
  str_number_full: types.string,
  houseAddress: types.string,
});

// ============================================================
// MeterModel — счётчик
// ============================================================

export const MeterModel = types
  .model('MeterModel', {
    id: types.identifier,
    meterType: types.frozen<TMeterTypeLabel>(),
    installationDate: types.string,
    isAutomatic: types.maybeNull(types.boolean),
    initialValues: types.array(types.number),
    description: types.string,
    areaId: types.string,
  })
  .views((self) => ({
    /** Получить тип счётчика как TMeterType для MeterType компонента */
    get rawType(): TMeterType {
      return self.meterType === 'hot'
        ? 'HotWaterAreaMeter'
        : 'ColdWaterAreaMeter';
    },

    /** Отформатированная дата установки: дд.мм.гггг */
    get formattedDate(): string {
      try {
        const d = new Date(self.installationDate);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
      } catch {
        return self.installationDate;
      }
    },

    /** Первое значение из initial_values для отображения */
    get displayValue(): number {
      return getInitialValue([...self.initialValues]);
    },

    /** Адрес из кэша (через родительский стор) */
    get address(): string {
      const store = getParent<IMetersStore>(self, 2);
      const area = store.areasCache.get(self.areaId);
      if (!area) return '';
      // Формат: "г Санкт-Петербург, ул Чудес, д 256, кв. 125"
      return `${area.houseAddress}, ${area.str_number_full}`;
    },
  }));

// ============================================================
// MetersStore
// ============================================================

export const MetersStore = types
  .model('MetersStore', {
    /** Счётчики текущей страницы */
    meters: types.array(MeterModel),
    /** Кэш адресов: areaId -> AreaModel */
    areasCache: types.map(AreaModel),
    /** Пагинация */
    offset: 0,
    limit: 20,
    count: 0,
    /** Состояние */
    isLoading: false,
    isDeleting: false,
    error: types.maybeNull(types.string),
  })
  .views((self) => ({
    get totalPages(): number {
      return Math.ceil(self.count / self.limit);
    },

    get currentPage(): number {
      return Math.floor(self.offset / self.limit) + 1;
    },
  }))
  .actions((self) => ({
    setLoading(v: boolean) {
      self.isLoading = v;
    },

    setDeleting(v: boolean) {
      self.isDeleting = v;
    },

    setError(e: string | null) {
      self.error = e;
    },

    setPage(page: number) {
      self.offset = (page - 1) * self.limit;
    },

    /** Заменить все счётчики текущей страницы (из сырых данных) */
    setMeters(rawList: RawMeter[]) {
      const models = rawList.map((raw) => {
        const typeLabel = toMeterTypeLabel(
          raw._type[0] || 'ColdWaterAreaMeter'
        );
        return MeterModel.create({
          id: raw.id,
          meterType: typeLabel,
          installationDate: raw.installation_date,
          isAutomatic: raw.is_automatic,
          initialValues: [...raw.initial_values] as number[],
          description: raw.description,
          areaId: raw.area.id,
        });
      });
      self.meters.replace(models);
    },

    setCount(c: number) {
      self.count = c;
    },

    /** Добавить адреса в кэш */
    cacheAreas(rawList: RawArea[]) {
      for (const raw of rawList) {
        if (!self.areasCache.has(raw.id)) {
          const area = AreaModel.create({
            id: raw.id,
            number: raw.number,
            str_number: raw.str_number,
            str_number_full: raw.str_number_full,
            houseAddress: raw.house.address,
          });
          self.areasCache.set(raw.id, area);
        }
      }
    },
  }));

export type IMeterModel = Instance<typeof MeterModel>;
export type IAreaModel = Instance<typeof AreaModel>;
export type IMetersStore = Instance<typeof MetersStore>;
