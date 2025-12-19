/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Get, Post, Put } from "../../utils/apiService";

// ---- Types ---- //

export type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface InventoryState {
  status: RequestStatus;
  error: string | null;
  inventoryCodes: any[];
}

const initialState: InventoryState = {
  status: "idle",
  error: null,
  inventoryCodes: [],
};

// ---- Inventory API Thunks ---- //

/**
 * Create inward entry
 * Backend returns ResponseEntity<Void> (no body)
 */
export const createInward = createAsyncThunk<
  void,
  any,
  { rejectValue: string }
>("inventory/createInward", async (payload, { rejectWithValue }) => {
  try {
    await Post("/inwards", payload);
    return;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to create inward";
    return rejectWithValue(message);
  }
});

/**
 * Create outward entry
 * Backend returns ResponseEntity<Void> (no body)
 */
export const createOutward = createAsyncThunk<
  void,
  any,
  { rejectValue: string }
>("inventory/createOutward", async (payload, { rejectWithValue }) => {
  try {
    await Post("/outwards", payload);
    return;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to create outward";
    return rejectWithValue(message);
  }
});

/**
 * Update outward entry
 * Backend returns OutwardRegisterDto directly
 */
export const updateOutward = createAsyncThunk<
  any,
  { id: string | number; payload: any },
  { rejectValue: string }
>("inventory/updateOutward", async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await Put(`/outwards/${id}`, payload);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to update outward";
    return rejectWithValue(message);
  }
});

/**
 * Create transfer entry
 * Backend returns ResponseEntity<Void> (no body)
 */
export const createTransfer = createAsyncThunk<
  void,
  any,
  { rejectValue: string }
>("inventory/createTransfer", async (payload, { rejectWithValue }) => {
  try {
    await Post("/transfers", payload);
    return;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to create transfer";
    return rejectWithValue(message);
  }
});

/**
 * Get inventory codes
 */
export const getInventoryCodes = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("inventory/getCodes", async (_, { rejectWithValue }) => {
  try {
    return await Get("/inventory/codes");
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to get inventory codes";
    return rejectWithValue(message);
  }
});

/**
 * Get inward record by ID with all details
 */
export const getInwardById = createAsyncThunk<
  any,
  number,
  { rejectValue: string }
>("inventory/getInwardById", async (id, { rejectWithValue }) => {
  try {
    return await Get(`/inwards/${id}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to get inward record";
    return rejectWithValue(message);
  }
});

/**
 * Update inward record quantities
 * Backend returns InwardHistoryDto directly
 */
export const updateInward = createAsyncThunk<
  any,
  { id: number; payload: any },
  { rejectValue: string }
>("inventory/updateInward", async ({ id, payload }, { rejectWithValue }) => {
  try {
    return await Put(`/inwards/${id}`, payload);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to update inward";
    return rejectWithValue(message);
  }
});

/**
 * Validate inward record (lock from edits)
 * Backend returns InwardHistoryDto directly
 */
export const validateInward = createAsyncThunk<
  any,
  number,
  { rejectValue: string }
>("inventory/validateInward", async (id, { rejectWithValue }) => {
  try {
    const result = await Post(`/inwards/${id}/validate`, {});
    return result;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to validate inward";
    return rejectWithValue(message);
  }
});

/**
 * Get outward record by ID with all details
 */
export const getOutwardById = createAsyncThunk<
  any,
  number,
  { rejectValue: string }
>("inventory/getOutwardById", async (id, { rejectWithValue }) => {
  try {
    return await Get(`/outwards/${id}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to get outward record";
    return rejectWithValue(message);
  }
});

/**
 * Validate outward record (lock from edits)
 * Backend returns OutwardRegisterDto directly
 */
export const validateOutward = createAsyncThunk<
  any,
  number,
  { rejectValue: string }
>("inventory/validateOutward", async (id, { rejectWithValue }) => {
  try {
    const result = await Post(`/outwards/${id}/validate`, {});
    return result;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to validate outward";
    return rejectWithValue(message);
  }
});

/**
 * Close outward record (set status to CLOSED)
 * Backend returns OutwardRegisterDto directly
 */
export const closeOutward = createAsyncThunk<
  any,
  number,
  { rejectValue: string }
>("inventory/closeOutward", async (id, { rejectWithValue }) => {
  try {
    const result = await Post(`/outwards/${id}/close`, {});
    return result;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to close outward";
    return rejectWithValue(message);
  }
});

/**
 * Get transfer record by ID with all details
 * Backend returns TransferRecordDto directly
 */
export const getTransferById = createAsyncThunk<
  any,
  number,
  { rejectValue: string }
>("inventory/getTransferById", async (id, { rejectWithValue }) => {
  try {
    return await Get(`/transfers/${id}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to get transfer record";
    return rejectWithValue(message);
  }
});

// ---- Slice ---- //

const inventorySlice = createSlice({
  name: "inventory",
  initialState,
  reducers: {
    clearInventoryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // getInventoryCodes
      .addCase(getInventoryCodes.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getInventoryCodes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.inventoryCodes = action.payload;
      })
      .addCase(getInventoryCodes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to get inventory codes";
      })
      // Error handling for other operations
      .addMatcher(
        (action) => action.type.startsWith("inventory/") && action.type.endsWith("/rejected"),
        (state, action: any) => {
          state.error = action.payload ?? "Operation failed";
        }
      );
  },
});

export const { clearInventoryError } = inventorySlice.actions;
export default inventorySlice.reducer;
