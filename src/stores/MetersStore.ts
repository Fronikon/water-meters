import { types, flow, getParent } from 'mobx-state-tree';
import type { Instance } from 'mobx-state-tree';
import type {
  RawMeter,
  RawArea,
  TMeterType,
  TMeterTypeLabel,
  MetersResponse,
} from '../types/meters.ts';
import { toMeterTypeLabel, getInitialValue } from '../types/meters.ts';
import { fetchMeters, fetchAreas } from '../api/metersApi.ts';

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
  .views((self) => {
    /** Получить родительский MetersStore (на 2 уровня выше) */
    function getStore() {
      return getParent<{
        areasCache: {
          get: (
            id: string
          ) => { houseAddress: string; str_number_full: string } | undefined;
        };
      }>(self, 2);
    }

    return {
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

      /**
       * Адрес из кэша.
       * Если адрес ещё не загружен — возвращает "Загрузка...".
       * Формат: "г Санкт-Петербург, ул Чудес, д 256, кв. 125"
       */
      get address(): string {
        const store = getStore();
        const area = store.areasCache.get(self.areaId);
        if (!area) {
          return 'Загрузка...';
        }
        return `${area.houseAddress}, ${area.str_number_full}`;
      },
    };
  });

// ============================================================
// Вспомогательный генератор для загрузки адресов с кэшированием
// Используется с yield* внутри flow-экшенов
// ============================================================

/**
 * Загружает адреса для указанных areaId, которых ещё нет в кэше.
 * Ничего не делает, если все id уже закэшированы.
 */
function* loadAreasForMeters(
  areaIds: string[],
  areasCache: {
    has: (id: string) => boolean;
    get: (id: string) => unknown;
    set: (id: string, value: IAreaModel) => void;
  }
): Generator<Promise<RawArea[]>, void, RawArea[]> {
  const uniqueIds = [...new Set(areaIds)];
  const missingIds = uniqueIds.filter((id) => !areasCache.has(id));

  if (missingIds.length === 0) return;

  const areas: RawArea[] = yield fetchAreas(missingIds);
  for (const raw of areas) {
    if (!areasCache.has(raw.id)) {
      const area = AreaModel.create({
        id: raw.id,
        number: raw.number,
        str_number: raw.str_number,
        str_number_full: raw.str_number_full,
        houseAddress: raw.house.address,
      });
      areasCache.set(raw.id, area);
    }
  }
}

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

    /** Асинхронная загрузка страницы */
    loadPage: flow(function* (offset: number) {
      self.isLoading = true;
      self.error = null;

      try {
        const response: MetersResponse = yield fetchMeters(self.limit, offset);

        self.offset = offset;
        self.count = response.count;

        // Маппим сырые данные в модели
        const models = response.results.map((raw) => {
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

        // Загружаем адреса для полученных счётчиков (до сброса isLoading)
        const areaIds = response.results.map((r) => r.area.id);
        yield* loadAreasForMeters(areaIds, self.areasCache);
      } catch (e: unknown) {
        const message =
          e instanceof Error ? e.message : 'Ошибка загрузки данных';
        self.error = message;
      } finally {
        self.isLoading = false;
      }
    }),
  }));

export type IMeterModel = Instance<typeof MeterModel>;
export type IAreaModel = Instance<typeof AreaModel>;
export type IMetersStore = Instance<typeof MetersStore>;
