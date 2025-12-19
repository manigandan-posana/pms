/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Get } from "../../utils/apiService";

// Query string helper with date formatting
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

    // Format Date objects as ISO strings (YYYY-MM-DD)
    let stringValue: string;
    if (value instanceof Date) {
      stringValue = value.toISOString().split("T")[0];
    } else {
      stringValue = String(value);
    }

    parts.push(
      `${encodeURIComponent(key)}=${encodeURIComponent(stringValue)}`
    );
  });

  return parts.length ? `?${parts.join("&")}` : "";
};

// ---- Types ---- //

export type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface HistoryState {
  inwardHistory: any[];
  outwardHistory: any[];
  transferHistory: any[];
  status: RequestStatus;
  error: string | null;
}

const initialState: HistoryState = {
  inwardHistory: [],
  outwardHistory: [],
  transferHistory: [],
  status: "idle",
  error: null,
};

// ---- History API Thunks ---- //

/**
 * Search inward history with pagination and advanced filters
 * @param params - Query parameters including page, size, projectId, supplierName, invoiceNo, startDate, endDate
 */
export const searchInwardHistory = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("history/searchInward", async (params = {}, { rejectWithValue }) => {
  try {
    return await Get(`/history/inwards${toQueryString(params)}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to search inward history";
    return rejectWithValue(message);
  }
});

/**
 * Search outward history with pagination and advanced filters
 * @param params - Query parameters including page, size, projectId, issueTo, jobNo, startDate, endDate
 */
export const searchOutwardHistory = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("history/searchOutward", async (params = {}, { rejectWithValue }) => {
  try {
    return await Get(`/history/outwards${toQueryString(params)}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to search outward history";
    return rejectWithValue(message);
  }
});

/**
 * Search transfer history with pagination and advanced filters
 * @param params - Query parameters including page, size, projectId, fromProject, toProject, startDate, endDate
 */
export const searchTransferHistory = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("history/searchTransfer", async (params = {}, { rejectWithValue }) => {
  try {
    return await Get(`/history/transfers${toQueryString(params)}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to search transfer history";
    return rejectWithValue(message);
  }
});

// ---- Slice ---- //

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    clearHistoryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // searchInwardHistory
      .addCase(searchInwardHistory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(searchInwardHistory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.inwardHistory = action.payload;
      })
      .addCase(searchInwardHistory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to search inward history";
      })
      // searchOutwardHistory
      .addCase(searchOutwardHistory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(searchOutwardHistory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.outwardHistory = action.payload;
      })
      .addCase(searchOutwardHistory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to search outward history";
      })
      // searchTransferHistory
      .addCase(searchTransferHistory.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(searchTransferHistory.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.transferHistory = action.payload;
      })
      .addCase(searchTransferHistory.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to search transfer history";
      });
  },
});

export const { clearHistoryError } = historySlice.actions;
export default historySlice.reducer;
