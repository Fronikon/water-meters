import { observer } from 'mobx-react-lite';
import { useRootStore } from './stores/RootStore';
import { MetersPage } from './components/MetersPage.tsx';

const App = observer(() => {
  useRootStore();

  return <MetersPage />;
});

export default App;
