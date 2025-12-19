/**
 * Hook to access the Redux store directly
 * Useful for accessing store in non-component contexts like services
 * 
 * The store reference is initialized in main.tsx via initializeStoreReference()
 */

declare global {
  interface Window {
    __REDUX_STORE__?: any;
  }
}

export function useAppStore() {
  // Access the store reference that was initialized in main.tsx
  if (!window.__REDUX_STORE__) {
    console.warn("Redux store not initialized. Make sure initializeStoreReference() is called in main.tsx");
    return null;
  }
  return window.__REDUX_STORE__;
}

/**
 * Initialize the Redux store reference for use in services
 * This should be called in main.tsx after creating the store
 * 
 * @param store - The Redux store instance
 * @example
 * import { store } from "./store/store";
 * import { initializeStoreReference } from "./hooks/useAppStore";
 * 
 * initializeStoreReference(store);
 */
export function initializeStoreReference(store: any) {
  if (!store) {
    throw new Error("Store is required to initialize store reference");
  }
  (window as any).__REDUX_STORE__ = store;
}
