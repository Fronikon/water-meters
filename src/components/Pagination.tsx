import React from 'react';
import styled from 'styled-components';

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

type PageItem = number | 'ellipsis-left' | 'ellipsis-right';

function getPageItems(page: number, totalPages: number): PageItem[] {
  // Все страницы помещаются
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  // Начало
  if (page <= 4) {
    return [
      1,
      2,
      3,
      'ellipsis-right',
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // Конец
  if (page >= totalPages - 3) {
    return [
      1,
      2,
      3,
      'ellipsis-left',
      totalPages - 2,
      totalPages - 1,
      totalPages,
    ];
  }

  // Середина
  return [
    1,
    'ellipsis-left',
    page - 1,
    page,
    page + 1,
    'ellipsis-right',
    totalPages,
  ];
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  totalPages,
  onChange,
}) => {
  if (totalPages <= 1) return null;

  const items = getPageItems(page, totalPages);

  return (
    <Nav aria-label="Пагинация">
      {items.map((item, idx) => {
        if (typeof item === 'number') {
          return (
            <PageButton
              key={item}
              type="button"
              $active={item === page}
              onClick={() => onChange(item)}
              aria-current={item === page ? 'page' : undefined}
            >
              {item}
            </PageButton>
          );
        }

        const isLeft = item === 'ellipsis-left';

        const targetPage = isLeft
          ? Math.max(1, page - 3)
          : Math.min(totalPages, page + 3);

        return (
          <PageButton
            key={`${item}-${idx}`}
            type="button"
            $active={false}
            onClick={() => onChange(targetPage)}
            aria-label={isLeft ? 'Предыдущие страницы' : 'Следующие страницы'}
          >
            ...
          </PageButton>
        );
      })}
    </Nav>
  );
};

const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: 6px;
  justify-content: flex-end;
`;

const ButtonBase = `
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid #ced5de;
  border-radius: 6px;
  font-size: 14px;
  line-height: 16px;
  background: #ffffff;
  color: #1f2939;
`;

const PageButton = styled.button<{
  $active: boolean;
}>`
  ${ButtonBase};

  cursor: pointer;

  transition:
    background-color 0.15s ease,
    color 0.15s ease;

  &:disabled {
    cursor: not-allowed;
    color: #9da6b4;
  }

  &:not(:disabled):hover {
    background-color: #e4e8ee;
  }

  ${({ $active }) =>
    $active &&
    `
      background-color: #F2F5F8;

      &:hover {
        background-color: #2f5fe0;
      }
    `}
`;
