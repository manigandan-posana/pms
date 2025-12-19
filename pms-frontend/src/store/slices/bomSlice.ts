/* eslint-disable @typescript-eslint/no-explicit-any */
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

export type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface BomState {
  status: RequestStatus;
  error: string | null;
  allocations: any[];
}

const initialState: BomState = {
  status: "idle",
  error: null,
  allocations: [],
};

// ---- BOM API Thunks ---- //

/**
 * Get BOM allocations for a project with pagination
 */
export const getProjectAllocations = createAsyncThunk<
  any,
  { projectId: string | number; params?: Record<string, any> },
  { rejectValue: string }
>("bom/getProjectAllocations", async ({ projectId, params = {} }, { rejectWithValue }) => {
  try {
    return await Get(`/bom/projects/${projectId}${toQueryString(params)}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to get project allocations";
    return rejectWithValue(message);
  }
});

/**
 * Create a new BOM allocation for a project
 * Backend returns BomLineDto directly
 */
export const createProjectAllocation = createAsyncThunk<
  any,
  { projectId: string | number; payload: any },
  { rejectValue: string }
>("bom/createProjectAllocation", async ({ projectId, payload }, { rejectWithValue }) => {
  try {
    const result = await Post(`/bom/projects/${projectId}/materials`, payload);
    return result;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to create project allocation";
    return rejectWithValue(message);
  }
});

/**
 * Update a BOM allocation
 */
export const updateBomAllocation = createAsyncThunk<
  any,
  { projectId: string | number; materialId: string | number; payload: any },
  { rejectValue: string }
>("bom/updateBomAllocation", async ({ projectId, materialId, payload }, { rejectWithValue }) => {
  try {
    return await Put(`/bom/projects/${projectId}/materials/${materialId}`, payload);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to update BOM allocation";
    return rejectWithValue(message);
  }
});

/**
 * Delete a BOM allocation
 */
export const deleteProjectAllocation = createAsyncThunk<
  any,
  { projectId: string | number; materialId: string | number },
  { rejectValue: string }
>("bom/deleteProjectAllocation", async ({ projectId, materialId }, { rejectWithValue }) => {
  try {
    return await Delete(`/bom/projects/${projectId}/materials/${materialId}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to delete project allocation";
    return rejectWithValue(message);
  }
});

// ---- Slice ---- //

const bomSlice = createSlice({
  name: "bom",
  initialState,
  reducers: {
    clearBomError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getProjectAllocations
      .addCase(getProjectAllocations.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getProjectAllocations.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.allocations = action.payload;
      })
      .addCase(getProjectAllocations.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to get project allocations";
      })
      // Error handling for other operations
      .addMatcher(
        (action) => action.type.startsWith("bom/") && action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.error = action.payload ?? "Operation failed";
        }
      );
  },
});

export const { clearBomError } = bomSlice.actions;
export default bomSlice.reducer;
