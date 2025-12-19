/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Get } from "../../utils/apiService";

// ---- Types ---- //

export type RequestStatus = "idle" | "loading" | "succeeded" | "failed";

export interface AppState {
  bootstrapData: any | null;
  userProjects: any[];
  status: RequestStatus;
  error: string | null;
}

const initialState: AppState = {
  bootstrapData: null,
  userProjects: [],
  status: "idle",
  error: null,
};

// ---- App API Thunks ---- //

/**
 * Bootstrap application data
 */
export const bootstrap = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("app/bootstrap", async (_, { rejectWithValue }) => {
  try {
    return await Get("/app/bootstrap");
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to bootstrap application";
    return rejectWithValue(message);
  }
});

/**
 * Get user accessible projects
 */
export const getUserProjects = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("app/getUserProjects", async (_, { rejectWithValue }) => {
  try {
    return await Get("/app/projects");
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to get user projects";
    return rejectWithValue(message);
  }
});

// ---- Slice ---- //

const appSlice = createSlice({
  name: "app",
  initialState,
  reducers: {
    clearAppError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // bootstrap
      .addCase(bootstrap.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(bootstrap.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.bootstrapData = action.payload;
      })
      .addCase(bootstrap.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to bootstrap application";
      })
      // getUserProjects
      .addCase(getUserProjects.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(getUserProjects.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.userProjects = action.payload;
      })
      .addCase(getUserProjects.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload ?? "Unable to get user projects";
      });
  },
});

export const { clearAppError } = appSlice.actions;
export default appSlice.reducer;
