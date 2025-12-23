import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Get, Post, Put, Delete } from "../../utils/apiService";

// Query string helper
const toQueryString = (params: Record<string, any> = {}): string => {
  const parts: string[] = [];

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        return;
      }
      value.forEach((item) => {
        if (item !== undefined && item !== null && item !== "") {
          parts.push(
            `${encodeURIComponent(key)}=${encodeURIComponent(String(item))}`
          );
        }
      });
      return;
    }

    if (value === "") {
      return;
    }

    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`
    );
  });

  return parts.length ? `?${parts.join("&")}` : "";
};

// ---- Types ---- //

export interface Material {
  // TODO: adjust these fields to match your backend shape
  id?: string;
  [key: string]: any;
}

export interface MaterialFilters {
  categories: string[];
  units: string[];
  lineTypes: string[];
}

export type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface MaterialsState {
  items: Material[];
  totalItems: number;
  totalPages: number;
  page: number;
  availableFilters: MaterialFilters;
  status: RequestStatus;
  error: string;
}

export interface FetchMaterialsArgs {
  query?: {
    page?: number;
    [key: string]: any;
  };
}

export interface FetchMaterialsResult {
  items: Material[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  filters: MaterialFilters;
}

// ---- Initial State ---- //

const initialState: MaterialsState = {
  items: [],
  totalItems: 0,
  totalPages: 1,
  page: 1,
  availableFilters: {
    categories: [],
    units: [],
    lineTypes: [],
  },
  status: "idle",
  error: "",
};

// ---- Thunks ---- //

export const fetchMaterials = createAsyncThunk<
  FetchMaterialsResult,
  FetchMaterialsArgs,
  { rejectValue: string }
>("materials/fetch", async ({ query }, { rejectWithValue }) => {
  try {
    const response = await Get(`/materials/search${toQueryString(query)}`);
    const items = (response?.content ?? []) as Material[];

    return {
      items,
      totalElements: response?.totalElements ?? items.length,
      totalPages: Math.max(1, response?.totalPages ?? 1),
      size: response?.size ?? query?.size ?? 10,
      number: response?.number ?? (query?.page ? query.page - 1 : 0),
      filters: {
        categories: response?.filters?.categories ?? [],
        units: response?.filters?.units ?? [],
        lineTypes: response?.filters?.lineTypes ?? [],
      },
    };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to fetch materials";
    return rejectWithValue(message);
  }
});

export const listMaterials = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("materials/list", async (params = {}, { rejectWithValue }) => {
  try {
    return await Get(`/materials${toQueryString(params)}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to list materials";
    return rejectWithValue(message);
  }
});

export const createMaterial = createAsyncThunk<
  Material,
  any,
  { rejectValue: string }
>("materials/create", async (payload, { rejectWithValue }) => {
  try {
    const result = await Post("/materials", payload);
    return result as Material;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to create material";
    return rejectWithValue(message);
  }
});

export const updateMaterial = createAsyncThunk<
  Material,
  { materialId: string | number; payload: any },
  { rejectValue: string }
>("materials/update", async ({ materialId, payload }, { rejectWithValue }) => {
  try {
    const result = await Put(`/materials/${materialId}`, payload);
    return result as Material;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to update material";
    return rejectWithValue(message);
  }
});

export const deleteMaterial = createAsyncThunk<
  string,
  string | number,
  { rejectValue: string }
>("materials/delete", async (materialId, { rejectWithValue }) => {
  try {
    await Delete(`/materials/${materialId}`);
    return String(materialId);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to delete material";
    return rejectWithValue(message);
  }
});

export const exportMaterials = createAsyncThunk<
  Blob,
  void,
  { rejectValue: string }
>("materials/export", async (_, { rejectWithValue }) => {
  try {
    return await Get<Blob, void>("/materials/export", undefined, {
      responseType: "blob",
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to export materials";
    return rejectWithValue(message);
  }
});

/**
 * Import materials from Excel file
 * Backend returns List<MaterialDto> directly
 */
export const importMaterials = createAsyncThunk<
  any,
  File,
  { rejectValue: string }
>("materials/import", async (file, { rejectWithValue }) => {
  try {
    const form = new FormData();
    form.append("file", file);
    return await Post("/materials/import", form);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to import materials";
    return rejectWithValue(message);
  }
});

/**
 * Get material inward history
 * Backend: /app/materials/{materialId}/inwards
 */
export const getMaterialInwardHistory = createAsyncThunk<
  any,
  string | number,
  { rejectValue: string }
>("materials/inwardHistory", async (materialId, { rejectWithValue }) => {
  try {
    return await Get(`/app/materials/${materialId}/inwards`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to get inward history";
    return rejectWithValue(message);
  }
});

/**
 * Get material movement history
 * Backend: /app/materials/{materialId}/movements
 */
export const getMaterialMovements = createAsyncThunk<
  any,
  string | number,
  { rejectValue: string }
>("materials/movements", async (materialId, { rejectWithValue }) => {
  try {
    return await Get(`/app/materials/${materialId}/movements`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to get material movements";
    return rejectWithValue(message);
  }
});

// ---- Slice ---- //

const materialSlice = createSlice({
  name: "materials",
  initialState,
  reducers: {
    clearMaterialError(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchMaterials
      .addCase(fetchMaterials.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchMaterials.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.items = action.payload.items;
        state.totalItems = action.payload.totalElements;
        state.totalPages = action.payload.totalPages;
        state.page = action.payload.number + 1;
        state.availableFilters = {
          categories: action.payload.filters.categories
            .map((value) => (value ?? "").trim())
            .filter(Boolean)
            .sort(),
          units: action.payload.filters.units
            .map((value) => (value ?? "").trim())
            .filter(Boolean)
            .sort(),
          lineTypes: action.payload.filters.lineTypes
            .map((value) => (value ?? "").trim())
            .filter(Boolean)
            .sort(),
        };
      })
      .addCase(fetchMaterials.rejected, (state, action) => {
        const message =
          action.payload ?? action.error.message ?? "Unable to fetch materials";
        state.status = "failed";
        state.error = message;
        state.items = [];
      })

      // deleteMaterial
      .addCase(deleteMaterial.rejected, (state, action) => {
        const message =
          action.payload ?? action.error.message ?? "Unable to delete material";
        state.error = message;
      })

      // createMaterial
      .addCase(createMaterial.rejected, (state, action) => {
        const message =
          action.payload ?? action.error.message ?? "Unable to create material";
        state.error = message;
      })

      // updateMaterial
      .addCase(updateMaterial.rejected, (state, action) => {
        const message =
          action.payload ?? action.error.message ?? "Unable to update material";
        state.error = message;
      })

      // exportMaterials
      .addCase(exportMaterials.rejected, (state, action) => {
        const message =
          action.payload ?? action.error.message ?? "Unable to export materials";
        state.error = message;
      })

      // importMaterials
      .addCase(importMaterials.rejected, (state, action) => {
        const message =
          action.payload ?? action.error.message ?? "Unable to import materials";
        state.error = message;
      });
  },
});

// ---- Exports ---- //

export const { clearMaterialError } = materialSlice.actions;
export default materialSlice.reducer;
