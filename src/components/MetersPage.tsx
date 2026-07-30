import React from 'react';
import styled from 'styled-components';
import { MetersTable } from './MetersTable.tsx';

export const MetersPage: React.FC = () => {
  return (
    <Page>
      <Title>Список счётчиков</Title>
      <MetersTable />
    </Page>
  );
};

const Page = styled.main`
  display: grid;
  overflow: hidden;
  padding: 16px;
  background-color: #f8f9fa;

  grid-template-rows: max-content 1fr;

  height: 100vh;
`;

const Title = styled.h1`
  font-size: 24px;
  line-height: 32px;
  font-weight: 500;
  margin-bottom: 16px;
  color: #1f2939;
`;
