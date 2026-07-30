import React, { type ComponentProps } from 'react';
import styled from 'styled-components';
import TrashIcon from '../assets/svg/trash.svg?react';

export const DeleteButton: React.FC<ComponentProps<'button'>> = (props) => {
  return (
    <Button {...props}>
      <TrashIcon />
    </Button>
  );
};

const Button = styled.button`
  border: none;
  background-color: #fee3e3;
  border-radius: 8px;
  padding: 10px 12px;
  width: 40px;
  height: 40px;
  cursor: pointer;

  & svg {
    width: 16px;
    height: 16px;

    & path {
      fill: #c53030;
    }
  }

  &:hover {
    background-color: #fed7d7;

    & svg {
      & path {
        fill: #9b2c2c;
      }
    }
  }

  &:disabled {
    background-color: #f2f5f8;
    cursor: not-allowed;

    & svg {
      & path {
        fill: #9da6b4;
      }
    }
  }
`;
