import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';

export interface CRUDState<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  selectedItem: T | null;
  modalOpen: boolean;
  formData: Partial<T>;
}

export interface UseCRUDOptions<T> {
  onFetch: () => Promise<T[]>;
  onCreate: (data: Partial<T>) => Promise<T>;
  onUpdate: (id: string | number, data: Partial<T>) => Promise<T>;
  onDelete: (id: string | number) => Promise<void>;
  onError?: (error: Error) => void;
  successMessage?: {
    create?: string;
    update?: string;
    delete?: string;
  };
}

/**
 * Hook for managing CRUD operations in admin pages
 * Handles loading states, errors, and provides convenient methods
 */
export function useCRUD<T extends { id: string | number }>(
  options: UseCRUDOptions<T>
) {
  const {
    onFetch,
    onCreate,
    onUpdate,
    onDelete,
    onError,
    successMessage = {},
  } = options;

  const [state, setState] = useState<CRUDState<T>>({
    data: [],
    loading: false,
    error: null,
    selectedItem: null,
    modalOpen: false,
    formData: {},
  });

  // Fetch all data
  const fetchData = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await onFetch();
      setState((prev) => ({ ...prev, data, loading: false }));
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Fetch failed');
      setState((prev) => ({ ...prev, error: err.message, loading: false }));
      onError?.(err);
      toast.error(err.message);
    }
  }, [onFetch, onError]);

  // Create new item
  const create = useCallback(
    async (data: Partial<T>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const newItem = await onCreate(data);
        setState((prev) => ({
          ...prev,
          data: [...prev.data, newItem],
          loading: false,
          modalOpen: false,
          formData: {},
        }));
        toast.success(successMessage.create || 'Item created successfully');
        return newItem;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Create failed');
        setState((prev) => ({ ...prev, error: err.message, loading: false }));
        onError?.(err);
        toast.error(err.message);
        throw error;
      }
    },
    [onCreate, onError, successMessage]
  );

  // Update existing item
  const update = useCallback(
    async (id: string | number, data: Partial<T>) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        const updatedItem = await onUpdate(id, data);
        setState((prev) => ({
          ...prev,
          data: prev.data.map((item) =>
            item.id === id ? updatedItem : item
          ),
          loading: false,
          modalOpen: false,
          formData: {},
          selectedItem: null,
        }));
        toast.success(successMessage.update || 'Item updated successfully');
        return updatedItem;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Update failed');
        setState((prev) => ({ ...prev, error: err.message, loading: false }));
        onError?.(err);
        toast.error(err.message);
        throw error;
      }
    },
    [onUpdate, onError, successMessage]
  );

  // Delete item
  const delete_ = useCallback(
    async (id: string | number) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));
      try {
        await onDelete(id);
        setState((prev) => ({
          ...prev,
          data: prev.data.filter((item) => item.id !== id),
          loading: false,
          selectedItem: null,
        }));
        toast.success(successMessage.delete || 'Item deleted successfully');
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Delete failed');
        setState((prev) => ({ ...prev, error: err.message, loading: false }));
        onError?.(err);
        toast.error(err.message);
        throw error;
      }
    },
    [onDelete, onError, successMessage]
  );

  // Open modal for creating
  const openCreateModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modalOpen: true,
      selectedItem: null,
      formData: {},
    }));
  }, []);

  // Open modal for editing
  const openEditModal = useCallback((item: T) => {
    setState((prev) => ({
      ...prev,
      modalOpen: true,
      selectedItem: item,
      formData: { ...item },
    }));
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setState((prev) => ({
      ...prev,
      modalOpen: false,
      selectedItem: null,
      formData: {},
    }));
  }, []);

  // Update form data
  const updateFormData = useCallback((field: string, value: any) => {
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, [field]: value },
    }));
  }, []);

  // Clear error
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  // Get item by ID
  const getItemById = useCallback(
    (id: string | number) => {
      return state.data.find((item) => item.id === id) || null;
    },
    [state.data]
  );

  // Save (create or update)
  const save = useCallback(
    async (data?: Partial<T>) => {
      const dataToSave = data || state.formData;
      if (state.selectedItem) {
        return update(state.selectedItem.id, dataToSave);
      } else {
        return create(dataToSave);
      }
    },
    [state.selectedItem, state.formData, create, update]
  );

  return {
    // State
    ...state,

    // Methods
    fetchData,
    create,
    update,
    delete: delete_,
    save,
    openCreateModal,
    openEditModal,
    closeModal,
    updateFormData,
    clearError,
    getItemById,

    // Convenience flags
    isCreating: state.selectedItem === null && state.modalOpen,
    isEditing: state.selectedItem !== null && state.modalOpen,
  };
}

export default useCRUD;
