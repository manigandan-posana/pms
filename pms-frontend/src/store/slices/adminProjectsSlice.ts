import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { bootstrapWorkspace } from "./workspaceSlice";
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

export interface AdminProject {
  id?: string;
  code?: string;
  name?: string;
  prefix?: string;
  projectManager?: string;
  // extend with whatever fields your backend returns
  [key: string]: any;
}

export interface AdminProjectsFilters {
  prefixes: string[];
}

export interface RawAdminProjectsFilters {
  prefixes?: Array<string | null | undefined>;
}

export interface SearchProjectsResponse {
  content?: AdminProject[];
  totalElements?: number;
  totalPages?: number;
  number?: number;
  size?: number;
  filters?: RawAdminProjectsFilters;
}

export interface AdminProjectsState {
  items: AdminProject[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
  status: RequestStatus;
  error: string;
  availableFilters: AdminProjectsFilters;
  selectedAdminProjectId: string | null;
  currentProject: any | null;
}

// ---- Initial State ---- //

const initialState: AdminProjectsState = {
  items: [],
  totalItems: 0,
  totalPages: 1,
  page: 1,
  pageSize: 10,
  status: "idle",
  error: "",
  availableFilters: { prefixes: [] },
  selectedAdminProjectId: null,
  currentProject: null,
};

// ---- Thunks ---- //

export const searchProjects = createAsyncThunk<
  SearchProjectsResponse,
  any,
  { rejectValue: string }
>("adminProjects/search", async (query, { rejectWithValue }) => {
  try {
    const res = await Get(`/admin/projects/search${toQueryString(query)}`);
    return res as SearchProjectsResponse;
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to load projects";
    return rejectWithValue(message);
  }
});

export const listProjects = createAsyncThunk<
  any,
  any,
  { rejectValue: string }
>("adminProjects/list", async (params = {}, { rejectWithValue }) => {
  try {
    return await Get(`/admin/projects${toQueryString(params)}`);
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to list projects";
    return rejectWithValue(message);
  }
});

export const createProject = createAsyncThunk<
  boolean,
  any,
  { rejectValue: string }
>("adminProjects/create", async (payload, { rejectWithValue, dispatch }) => {
  try {
    await Post("/admin/projects", payload);
    dispatch(bootstrapWorkspace());
    return true;
  } catch (err: unknown) {
    let message = "Unable to create project";
    if (axios.isAxiosError(err) && err.response) {
      message = err.response.data?.message || err.response.data?.error || err.response.statusText || message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    return rejectWithValue(message);
  }
});

export const updateProject = createAsyncThunk<
  boolean,
  { projectId: string | number; payload: any },
  { rejectValue: string }
>(
  "adminProjects/update",
  async ({ projectId, payload }, { rejectWithValue, dispatch }) => {
    try {
      await Put(`/admin/projects/${projectId}`, payload);
      dispatch(bootstrapWorkspace());
      return true;
    } catch (err: unknown) {
      let message = "Unable to update project";
      if (axios.isAxiosError(err) && err.response) {
        message = err.response.data?.message || err.response.data?.error || err.response.statusText || message;
      } else if (err instanceof Error) {
        message = err.message;
      }
      return rejectWithValue(message);
    }
  }
);

export const deleteProject = createAsyncThunk<
  boolean,
  string | number,
  { rejectValue: string }
>("adminProjects/delete", async (projectId, { rejectWithValue, dispatch }) => {
  try {
    await Delete(`/admin/projects/${projectId}`);
    dispatch(bootstrapWorkspace());
    return true;
  } catch (err: unknown) {
    let message = "Unable to delete project";
    if (axios.isAxiosError(err) && err.response) {
      message = err.response.data?.message || err.response.data?.error || err.response.statusText || message;
    } else if (err instanceof Error) {
      message = err.message;
    }
    return rejectWithValue(message);
  }
});

export const fetchProjectDetails = createAsyncThunk<
  any,
  string | number,
  { rejectValue: string }
>("adminProjects/details", async (projectId, { rejectWithValue }) => {
  try {
    return await Get(`/admin/projects/${projectId}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to load project";
    return rejectWithValue(message);
  }
});

export const updateProjectTeam = createAsyncThunk<
  any,
  { projectId: string | number; assignments: any[] },
  { rejectValue: string }
>("adminProjects/updateTeam", async ({ projectId, assignments }, { rejectWithValue }) => {
  try {
    return await Put(`/admin/projects/${projectId}/team`, assignments);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to update team";
    return rejectWithValue(message);
  }
});

export const fetchUserProjectDetails = createAsyncThunk<
  any,
  string | number,
  { rejectValue: string }
>("adminProjects/userDetails", async (projectId, { rejectWithValue }) => {
  try {
    return await Get(`/app/projects/${projectId}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to load project details";
    return rejectWithValue(message);
  }
});

export const updateUserProjectTeam = createAsyncThunk<
  any,
  { projectId: string | number; assignments: any[] },
  { rejectValue: string }
>("adminProjects/updateUserTeam", async ({ projectId, assignments }, { rejectWithValue }) => {
  try {
    return await Put(`/app/projects/${projectId}/team`, assignments);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to update team";
    return rejectWithValue(message);
  }
});

// ---- Helpers ---- //

const normalizePrefixes = (
  prefixes?: Array<string | null | undefined>
): string[] =>
  Array.from(new Set((prefixes ?? []).map((v) => (v ?? "").trim())))
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));

// ---- Slice ---- //

const adminProjectsSlice = createSlice({
  name: "adminProjects",
  initialState,
  reducers: {
    clearProjectError(state) {
      state.error = "";
    },
    setSelectedAdminProject(state, action) {
      state.selectedAdminProjectId = action.payload;
    },
    clearCurrentProject(state) {
      state.currentProject = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchProjects.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(searchProjects.fulfilled, (state, action) => {
        state.status = "succeeded";
        const response = action.payload;
        state.items = response.content ?? [];
        state.totalItems = response.totalElements ?? state.items.length;
        state.totalPages = Math.max(1, response.totalPages ?? 1);
        state.page = (response.number ?? 0) + 1;
        state.pageSize = response.size ?? state.pageSize;
        state.availableFilters = {
          prefixes: normalizePrefixes(response.filters?.prefixes),
        };
      })
      .addCase(searchProjects.rejected, (state, action) => {
        state.status = "failed";
        state.items = [];
        state.totalItems = 0;
        state.totalPages = 1;
        state.page = 1;
        state.pageSize = 10;
        const message =
          action.payload ??
          action.error.message ??
          "Unable to load projects";
        state.error = message;
      })
      .addCase(fetchProjectDetails.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(fetchProjectDetails.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentProject = action.payload;
      })
      .addCase(fetchProjectDetails.rejected, (state, action) => {
        state.status = "failed";
        const message =
          action.payload ?? action.error.message ?? "Unable to load project details";
        state.error = message;
      })
      .addCase(updateProjectTeam.fulfilled, (state, action) => {
        state.currentProject = action.payload;
        state.error = "";
      })
      .addCase(updateProjectTeam.rejected, (state, action) => {
        const message =
          action.payload ?? action.error.message ?? "Unable to update project team";
        state.error = message;
      })
      .addCase(createProject.rejected, (state, action) => {
        const message =
          action.payload ??
          action.error.message ??
          "Unable to create project";
        state.error = message;
      })
      .addCase(updateProject.rejected, (state, action) => {
        const message =
          action.payload ??
          action.error.message ??
          "Unable to update project";
        state.error = message;
      })
      .addCase(deleteProject.rejected, (state, action) => {
        const message =
          action.payload ??
          action.error.message ??
          "Unable to delete project";
        state.error = message;
      })
      .addCase(fetchUserProjectDetails.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.currentProject = action.payload;
      })
      .addCase(fetchUserProjectDetails.rejected, (state, action) => {
        state.status = "failed";
        const message = action.payload ?? action.error.message ?? "Unable to load project details";
        state.error = message;
      })
      .addCase(updateUserProjectTeam.fulfilled, (state, action) => {
        state.currentProject = action.payload;
        state.error = "";
      })
      .addCase(updateUserProjectTeam.rejected, (state, action) => {
        const message = action.payload ?? action.error.message ?? "Unable to update project team";
        state.error = message;
      });
  },
});

// ---- Exports ---- //

export const {
  clearProjectError,
  setSelectedAdminProject,
  clearCurrentProject,
} = adminProjectsSlice.actions;
export default adminProjectsSlice.reducer;
