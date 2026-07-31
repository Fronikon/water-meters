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
import { fetchMeters, fetchAreas, deleteMeter } from '../api/metersApi.ts';

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
    /**
     * Получить родительский MetersStore.
     * ВНИМАНИЕ: глубина (2) жёстко завязана на текущую структуру дерева
     * (MetersStore -> types.array(MeterModel) -> MeterModel). Если модель
     * когда-нибудь будет вложена иначе или переиспользована в другом сторе,
     * этот метод сломается в рантайме без ошибки типов на этапе компиляции.
     */
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
        const d = new Date(self.installationDate);
        if (Number.isNaN(d.getTime())) {
          // new Date() не бросает исключение на невалидной строке —
          // она возвращает Invalid Date, поэтому проверяем явно.
          return self.installationDate;
        }
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}.${month}.${year}`;
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
  })
  .volatile(() => ({
    /**
     * Транзиентный UI-флаг: идёт удаление именно этого счётчика.
     * Не персистится в snapshot — только для отрисовки спиннера/затемнения
     * на месте элемента, пока он ещё числится в списке.
     */
    isRemoving: false,
  }))
  .actions((self) => ({
    setRemoving(v: boolean) {
      self.isRemoving = v;
    },
  }));

// ============================================================
// Вспомогательные функции (чистые, без обращения к self)
// ============================================================

/** Единая точка маппинга сырых данных API в snapshot MeterModel */
function rawMeterToSnapshot(raw: RawMeter) {
  const typeLabel = toMeterTypeLabel(raw._type[0] || 'ColdWaterAreaMeter');
  return {
    id: raw.id,
    meterType: typeLabel,
    installationDate: raw.installation_date,
    isAutomatic: raw.is_automatic,
    initialValues: [...raw.initial_values] as number[],
    description: raw.description,
    areaId: raw.area.id,
  };
}

/**
 * Загружает адреса для указанных areaId, которых ещё нет в кэше.
 * Ничего не делает, если все id уже закэшированы.
 * Используется с yield* внутри flow-экшенов.
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

    /**
     * Идёт ли сейчас любая мутирующая операция над meters/offset/count.
     * Используется, чтобы loadPage и removeMeter не выполнялись параллельно
     * и не рассинхронизировали список.
     */
    get isBusy(): boolean {
      return self.isLoading || self.isDeleting;
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

    /**
     * Заменить все счётчики текущей страницы (из сырых данных).
     * В отличие от предыдущей версии — теперь, как и loadPage, обновляет
     * count и подгружает адреса, чтобы не оставлять счётчики с вечным
     * "Загрузка..." при использовании этого action напрямую.
     */
    setMeters: flow(function* (rawList: RawMeter[], count?: number) {
      const models = rawList.map((raw) =>
        MeterModel.create(rawMeterToSnapshot(raw))
      );
      self.meters.replace(models);
      if (count !== undefined) {
        self.count = count;
      }
      const areaIds = rawList.map((r) => r.area.id);
      yield* loadAreasForMeters(areaIds, self.areasCache);
    }),

    setCount(c: number) {
      self.count = c;
    },
  }))
  .actions((self) => ({
    /**
     * Удаление счётчика.
     *
     * Важно: элемент НЕ убирается из meters сразу. Вместо этого он
     * помечается isRemoving = true (UI может показать спиннер/затемнение
     * на его месте), а фактическая замена в массиве происходит одной
     * атомарной операцией splice(index, 1, newMeter) — только когда
     * замена уже загружена. Это гарантирует, что meters.length никогда
     * не проседает до 19: страница либо остаётся полной (20), либо,
     * если удаляемый элемент был последним в общем списке (пополнить
     * нечем), становится короче обоснованно — потому что элементов
     * реально стало меньше.
     *
     * - Если запрос на удаление упал — снимаем isRemoving, ничего в
     *   массиве не менялось, показываем ошибку.
     * - Если успешен, но пополнить нечем (последняя страница) — тогда
     *   и только тогда реально splice(index, 1).
     *
     * Гонки: если операция уже идёт (isBusy — покрывает и removeMeter,
     * и loadPage), новый вызов просто отклоняется — это НЕ очередь.
     * Повторный клик во время удаления/загрузки будет молча
     * проигнорирован. Если нужна очередь кликов — блокируйте кнопку
     * на уровне компонента, пока isBusy === true.
     */
    removeMeter: flow(function* (id: string) {
      if (self.isBusy) return; // уже идёт удаление или загрузка — игнорируем
      self.isDeleting = true;
      self.error = null;

      const index = self.meters.findIndex((m) => m.id === id);
      if (index === -1) {
        self.isDeleting = false;
        return;
      }
      const meter = self.meters[index];
      meter.setRemoving(true); // визуально помечаем, но НЕ убираем из массива

      try {
        // 1. Выполняем DELETE на сервере
        yield deleteMeter(id);
        self.count = Math.max(0, self.count - 1);

        // 2. Определяем, есть ли чем заполнить освободившееся место.
        // meters.length всё ещё включает удаляемый элемент (он не убран),
        // поэтому индекс кандидата на замену — offset + (length - 1),
        // т.е. следующий за текущей страницей элемент общего списка.
        const nextOffset = self.offset + self.meters.length - 1;

        if (nextOffset < self.count) {
          const response: MetersResponse = yield fetchMeters(1, nextOffset);
          if (response.results.length > 0) {
            const raw = response.results[0];
            const nextMeter = MeterModel.create(rawMeterToSnapshot(raw));

            // Подгружаем адрес нового счётчика ДО того, как он попадёт
            // на экран, чтобы не мелькнуло "Загрузка...".
            yield* loadAreasForMeters([raw.area.id], self.areasCache);

            // 3. Атомарная замена: массив как был длиной 20, так и остался.
            self.meters.splice(index, 1, nextMeter);
          } else {
            // Сервер сказал, что элемент есть (nextOffset < count), но
            // ничего не вернул — реального пополнения нет, убираем как есть.
            self.meters.splice(index, 1);
          }
        } else {
          // Пополнять нечем (это был последний элемент общего списка) —
          // страница обоснованно становится короче.
          self.meters.splice(index, 1);
        }
      } catch (e: unknown) {
        // Ошибка — массив не трогали, просто снимаем визуальную пометку
        meter.setRemoving(false);
        const message =
          e instanceof Error ? e.message : 'Ошибка удаления счётчика';
        self.error = message;
      } finally {
        self.isDeleting = false;
      }
    }),

    /** Асинхронная загрузка страницы */
    loadPage: flow(function* (offset: number) {
      if (self.isBusy) return; // не даём гонку с removeMeter/другой loadPage
      self.isLoading = true;
      self.error = null;

      try {
        const response: MetersResponse = yield fetchMeters(self.limit, offset);

        self.offset = offset;
        self.count = response.count;

        const models = response.results.map((raw) =>
          MeterModel.create(rawMeterToSnapshot(raw))
        );
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
