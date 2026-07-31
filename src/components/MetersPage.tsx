import React, { useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import styled from 'styled-components';
import { useRootStore } from '../stores/RootStore.ts';
import { MetersTable } from './MetersTable.tsx';
import { Pagination } from './Pagination.tsx';
import type { TMeter } from '../types/meters.ts';

export const MetersPage: React.FC = observer(() => {
  const { metersStore } = useRootStore();

  useEffect(() => {
    metersStore.loadPage(0);
  }, [metersStore]);

  const handlePageChange = (page: number) => {
    const offset = (page - 1) * metersStore.limit;
    metersStore.loadPage(offset);
  };

  const handleDelete = (id: string) => {
    metersStore.removeMeter(id);
  };

  // Маппим MST-модели в TMeter для компонента таблицы
  const meters: TMeter[] = metersStore.meters.map((m) => ({
    id: m.id,
    type: m.rawType,
    installDate: m.formattedDate,
    automatic: m.isAutomatic === true,
    currentValue: m.displayValue,
    address: m.address,
    note: m.description,
  }));

  return (
    <Page>
      <Title>Список счётчиков</Title>
      {metersStore.error && <ErrorBanner>{metersStore.error}</ErrorBanner>}
      <TableWrapper>
        <MetersTable
          meters={meters}
          startIndex={metersStore.offset}
          onDelete={handleDelete}
        />
        <Footer>
          <Pagination
            page={metersStore.currentPage}
            totalPages={metersStore.totalPages}
            onChange={handlePageChange}
          />
        </Footer>
      </TableWrapper>
      {metersStore.isLoading && <LoadingOverlay>Загрузка...</LoadingOverlay>}
    </Page>
  );
});

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

const TableWrapper = styled.div`
  display: grid;
  grid-template-rows: 1fr min-content;
  overflow: hidden;

  border: 1px solid #e0e5eb;
  border-radius: 12px;
  background-color: #ffffff;
`;

const Footer = styled.div`
  padding: 8px 16px;

  border-top: 1px solid #e0e5eb;
`;

const ErrorBanner = styled.div`
  padding: 8px 12px;
  margin-bottom: 8px;
  background-color: #fff5f5;
  border: 1px solid #feb2b2;
  border-radius: 8px;
  color: #c53030;
  font-size: 14px;
  line-height: 20px;
`;

const LoadingOverlay = styled.div`
  position: fixed;
  bottom: 16px;
  right: 16px;
  padding: 8px 16px;
  background-color: #1f2939;
  color: #ffffff;
  border-radius: 8px;
  font-size: 14px;
  line-height: 20px;
  opacity: 0.9;
`;
