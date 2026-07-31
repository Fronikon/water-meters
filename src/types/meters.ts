// ============================================================
// Raw DTO типы — как приходит с сервера (не для UI напрямую)
// ============================================================

/** Тип счётчика: первый элемент массива _type */
export type TMeterType = 'HotWaterAreaMeter' | 'ColdWaterAreaMeter';

/** Сырой ответ от GET /meters/ */
export interface RawMeter {
  id: string;
  _type: string[];
  area: { id: string };
  is_automatic: boolean | null;
  communication: string;
  description: string;
  serial_number: string;
  installation_date: string; // ISO datetime, напр. "2010-10-16T00:00:00"
  brand_name: string | null;
  model_name: string | null;
  initial_values: number[];
}

export interface MetersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawMeter[];
}

/** Сырой ответ от GET /areas/ */
export interface RawArea {
  id: string;
  number: number;
  str_number: string;
  str_number_full: string;
  house: {
    address: string;
    id: string;
    fias_addrobjs: string[];
  };
}

export interface AreasResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: RawArea[];
}

// ============================================================
// Производные типы для UI
// ============================================================

/** Удобный enum для отображения */
export type TMeterTypeLabel = 'cold' | 'hot';

/**
 * UI-модель счётчика (используется в компонентах таблицы).
 * Это плоская структура, обогащённая адресом из кэша.
 */
export type TMeter = {
  id: string;
  type: TMeterType;
  installDate: string;
  automatic: boolean;
  currentValue: number;
  address: string;
  note: string;
};

/**
 * Маппинг _type -> meterType
 * ColdWaterAreaMeter -> "cold"
 * HotWaterAreaMeter -> "hot"
 */
export function toMeterTypeLabel(raw: string): TMeterTypeLabel {
  switch (raw) {
    case 'ColdWaterAreaMeter':
      return 'cold';
    case 'HotWaterAreaMeter':
      return 'hot';
    default:
      return 'cold';
  }
}

/**
 * Для initial_values в UI показываем первый элемент (initial_values[0]).
 * Если массив пуст — 0.
 * Если элементов больше одного, остальные игнорируем (по документации обычно один элемент).
 */
export function getInitialValue(values: number[]): number {
  return values.length > 0 ? values[0] : 0;
}
