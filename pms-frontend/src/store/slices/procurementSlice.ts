/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Get, Post } from "../../utils/apiService";

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

export interface ProcurementState {
  requests: any[];
  status: RequestStatus;
  error: string | null;
}

const initialState: ProcurementState = {
  requests: [],
  status: "idle",
  error: null,
};

// ---- Procurement API Thunks ---- //

/**
 * List procurement requests with pagination
 */
export const listProcurementRequests = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("procurement/listRequests", async (params = {}, { rejectWithValue }) => {
  try {
    return await Get(`/procurement/requests${toQueryString(params)}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to list procurement requests";
    return rejectWithValue(message);
  }
});

/**
 * Create a new procurement request
 * Backend returns ProcurementRequestDto directly
 */
export const createProcurementRequest = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("procurement/createRequest", async (payload, { rejectWithValue }) => {
  try {
    const result = await Post("/procurement/requests", payload);
    return result;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to create procurement request";
    return rejectWithValue(message);
  }
});

/**
 * Resolve a procurement request (approve/reject)
 * Backend returns ProcurementRequestDto directly
 */
export const resolveProcurementRequest = createAsyncThunk<
  any,
  { id: string | number; payload: any },
  { rejectValue: string }
>("procurement/resolveRequest", async ({ id, payload }, { rejectWithValue }) => {
  try {
    const result = await Post(`/procurement/requests/${id}/decision`, payload);
    return result;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to resolve procurement request";
    return rejectWithValue(message);
  }
});

// ---- Slice ---- //

const procurementSlice = createSlice({
  name: "procurement",
  initialState,
  reducers: {
    clearProcurementError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // listProcurementRequests
      .addCase(listProcurementRequests.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(listProcurementRequests.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.requests = action.payload;
      })
      .addCase(listProcurementRequests.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to list procurement requests";
      })
      // Error handling for other operations
      .addMatcher(
        (action) => action.type.startsWith("procurement/") && action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.error = action.payload ?? "Operation failed";
        }
      );
  },
});

export const { clearProcurementError } = procurementSlice.actions;
export default procurementSlice.reducer;
