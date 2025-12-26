import { createSlice, createAsyncThunk, type PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { Get, Post } from "../../utils/apiService";

/*
 * The auth slice stores minimal information from the MSAL authentication
 * result.  We keep the user's name, email, ID token, access token and
 * assigned roles.  A derived `role` property holds the first role in
 * the array (if present) for convenience when routing.  On logout the
 * state is reset and any persisted storage is cleared.
 */

export interface AuthState {
  name: string | null;
  email: string | null;
  idToken: string | null;
  accessToken: string | null;
  token: string | null;
  roles: string[];
  role: string | null;
  permissions: string[];
  loading: boolean;
  error: string | null;
}

// ---- Auth API Thunks ---- //

/**
 * Get current user session information
 */
export const getSession = createAsyncThunk<
  any,
  void,
  { rejectValue: string }
>("auth/session", async (_, { rejectWithValue }) => {
  try {
    return await Get("/auth/session");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to get session";
    return rejectWithValue(message);
  }
});

/**
 * Logout current user
 * Backend returns ResponseEntity<Void> (204 No Content)
 */
export const logoutUser = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>("auth/logout", async (_, { rejectWithValue }) => {
  try {
    await Post("/auth/logout", {});
    return;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Logout failed";
    return rejectWithValue(message);
  }
});

const initialState: AuthState = {
  name: null,
  email: null,
  idToken: null,
  accessToken: null,
  token: null,
  roles: [],
  role: null,
  permissions: [],
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    /**
     * Merge the given user fields into the state.  If a roles array is
     * provided, derive the primary role from the first element.
     */
    setUser: (state, action: PayloadAction<Partial<AuthState>>) => {
      Object.assign(state, action.payload);
      if (action.payload.roles && action.payload.roles.length > 0) {
        state.role = action.payload.roles[0];
      }
      if (action.payload.permissions) {
        state.permissions = action.payload.permissions as string[];
      }
      // Backwards-compatible `token` field used by older components
      state.token = (action.payload.accessToken as string | null) ?? (action.payload.idToken as string | null) ?? state.token;
    },
    /**
     * Clear all authentication state and purge stored tokens.
     * This clears everything: Redux state, session storage, and local storage
     */
    logout: (state) => {
      // Reset Redux state to initial values
      Object.assign(state, initialState);
      
      // Clear all session storage
      try {
        sessionStorage.clear();
      } catch (e) {
        console.error("Failed to clear sessionStorage:", e);
      }
      
      // Clear all local storage (including redux-persist)
      try {
        localStorage.clear();
      } catch (e) {
        console.error("Failed to clear localStorage:", e);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Session
      .addCase(getSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getSession.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          Object.assign(state, action.payload);
          if (action.payload.permissions) {
            state.permissions = action.payload.permissions as string[];
          }
        }
      })
      .addCase(getSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload ?? "Unable to get session";
      })
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        Object.assign(state, initialState);
        try {
          sessionStorage.clear();
          localStorage.clear();
        } catch (e) {
          console.error("Failed to clear storage:", e);
        }
      })
      .addCase(logoutUser.rejected, (state) => {
        // Even if logout fails, clear the state
        Object.assign(state, initialState);
        try {
          sessionStorage.clear();
          localStorage.clear();
        } catch (e) {
          console.error("Failed to clear storage:", e);
        }
      });
  },
});

export const { setUser, logout } = authSlice.actions;
export default authSlice.reducer;

export const getLoggedInUserInfo = (state: RootState) => state.auth;