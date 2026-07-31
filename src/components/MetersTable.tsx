import React from 'react';
import styled from 'styled-components';
import { type TMeter } from '../types/meters.ts';
import { DeleteButton } from './DeleteButton.tsx';
import { MeterType } from './MeterType.tsx';
export interface MetersTableProps {
  meters: TMeter[];
  startIndex: number;
  onDelete: (id: string) => void;
  isDeleting?: boolean;
}

const columns = `80px 120px 160px 140px 160px minmax(200px, 1fr) minmax(160px, 1fr) 64px`;

export const MetersTable: React.FC<MetersTableProps> = ({
  meters,
  startIndex,
  onDelete,
  isDeleting = false,
}) => {
  return (
    <Wrapper>
      <TableContainer>
        <Header>
          <Th $center>№</Th>
          <Th>Тип</Th>
          <Th>Дата установки</Th>
          <Th>Автоматический</Th>
          <Th>Текущие показания</Th>
          <Th>Адрес</Th>
          <Th>Примечание</Th> <Th />
        </Header>
        <Body>
          {meters.length === 0 ? (
            <EmptyRow>Счётчики не найдены</EmptyRow>
          ) : (
            meters.map((meter, i) => {
              const orderNumber = String(startIndex + 1 + i);

              return (
                <Row key={meter.id}>
                  <Td>
                    <Ellipsis $center title={orderNumber}>
                      {orderNumber}
                    </Ellipsis>
                  </Td>
                  <Td>
                    <MeterType type={meter.type} />
                  </Td>
                  <Td>{meter.installDate}</Td>
                  <Td>{meter.automatic ? 'да' : 'нет'}</Td>
                  <Td>{meter.currentValue}</Td>
                  <Td>
                    <Ellipsis title={meter.address}> {meter.address}</Ellipsis>
                  </Td>
                  <Td>
                    <Ellipsis title={meter.note}>{meter.note || '-'}</Ellipsis>
                  </Td>
                  <Td>
                    <DeleteButton
                      type="button"
                      className="row-delete"
                      aria-label={`Удалить счётчик №${meter.id}`}
                      onClick={() => onDelete(meter.id)}
                      disabled={isDeleting}
                    />
                  </Td>
                </Row>
              );
            })
          )}
        </Body>
      </TableContainer>
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: grid;

  grid-template-rows: 1fr min-content;
  overflow-x: hidden;

  background-color: #ffffff;
`;

const TableContainer = styled.div`
  display: grid;
  grid-template-rows: max-content 1fr;
  overflow: hidden;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: ${columns};
  background-color: #f0f3f7;
  scrollbar-gutter: stable;
`;

const Body = styled.div`
  overflow-y: auto;

  scrollbar-gutter: stable;
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: ${columns};

  &:not(:last-child) {
    border-bottom: 1px solid #e0e5eb;
  }

  &:hover {
    background-color: #f9fafb;
  }

  &:hover .row-delete {
    visibility: visible;
  }
`;

const Th = styled.div<{ $center?: boolean }>`
  padding: 8px 12px;
  color: #697180;
  font-weight: 500;
  font-size: 13px;
  line-height: 16px;
  white-space: nowrap;
  ${({ $center }) => $center && `text-align: center; `}
`;

const Td = styled.div`
  min-width: 0;
  padding: 6px 12px;
  color: #1f2939;
  background-color: #ffffff;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;

  &:first-child {
    color: #5e6674;
  }

  .row-delete {
    visibility: hidden;
  }
`;

const EmptyRow = styled.div`
  padding: 32px 0;
  color: #9ca3af;
  text-align: center;
`;

const Ellipsis = styled.span<{ $center?: boolean }>`
  display: block;
  min-width: 0;
  width: 100%;

  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;

  ${({ $center }) => $center && `text-align: center;`};
`;
