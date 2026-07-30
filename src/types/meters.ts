export type TMeterType = 'HotWaterAreaMeter' | 'ColdWaterAreaMeter';

export type TMeter = {
  id: string;
  type: TMeterType;
  installDate: string;
  automatic: boolean;
  currentValue: number;
  address: string;
  note: string;
};
