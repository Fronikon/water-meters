import styled from 'styled-components';
import { observer } from 'mobx-react-lite';
import { useRootStore } from './stores/RootStore';

const Container = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;
`;

const Title = styled.h1`
  color: ${({ theme }) => theme.colors.primary};
  font-size: ${({ theme }) => theme.fontSize.xl};
`;

const App = observer(() => {
  useRootStore();

  return (
    <Container>
      <Title>Water Meters</Title>
    </Container>
  );
});

export default App;
