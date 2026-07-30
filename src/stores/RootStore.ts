import { types } from 'mobx-state-tree';
import type { Instance } from 'mobx-state-tree';
import { createContext, useContext } from 'react';

export const RootStore = types
  .model('RootStore', {
    // Add your models here
  })
  .actions(() => ({
    // Add your actions here
  }));

export type IRootStore = Instance<typeof RootStore>;

let store: IRootStore | null = null;

export function initializeStore(): IRootStore {
  if (store === null) {
    store = RootStore.create({});
  }
  return store;
}

const RootStoreContext = createContext<IRootStore | null>(null);

export function useRootStore(): IRootStore {
  const context = useContext(RootStoreContext);
  if (!context) {
    throw new Error('useRootStore must be used within RootStoreProvider');
  }
  return context;
}

export default RootStoreContext;
