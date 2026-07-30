import React, { type ReactNode } from 'react';
import styled from 'styled-components';
import type { TMeterType } from '../types/meters.ts';

import GVSIcon from '../assets/svg/gvs_icon.svg?react';
import HBSIcon from '../assets/svg/hbs_icon.svg?react';

export type TMeterTypeConfig = {
  label: string;
  icon: ReactNode;
};

const METER_TYPE_CONFIG: Record<TMeterType, TMeterTypeConfig> = {
  ColdWaterAreaMeter: { label: 'ХВС', icon: <HBSIcon /> },
  HotWaterAreaMeter: { label: 'ГВС', icon: <GVSIcon /> },
};

type TMeterTypeProps = {
  type: TMeterType;
};

export const MeterType: React.FC<TMeterTypeProps> = (props) => {
  const { type } = props;

  const config = METER_TYPE_CONFIG[type];

  return (
    <Container>
      {config.icon}
      {config.label}
    </Container>
  );
};

const Container = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  line-height: 20px;
  color: #1d2432;
`;
