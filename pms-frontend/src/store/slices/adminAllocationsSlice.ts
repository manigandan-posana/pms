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

export interface AllocationProject {
  id?: string;
  name?: string;
  [key: string]: any;
}

export interface AllocationMaterial {
  id?: string;
  name?: string;
  [key: string]: any;
}

export interface BomLine {
  materialId: string;
  quantity: number;
  [key: string]: any;
}

export type BomByProject = Record<string, BomLine[]>;
export type BomStatusByProject = Record<string, RequestStatus>;

export interface LoadAllocationDataResult {
  projects: AllocationProject[];
  materials: AllocationMaterial[];
}

export interface AdminAllocationsState {
  projects: AllocationProject[];
  materials: AllocationMaterial[];
  bomByProject: BomByProject;
  bomStatusByProject: BomStatusByProject;
  status: RequestStatus;
  error: string;
}

// ---- Initial State ---- //

const initialState: AdminAllocationsState = {
  projects: [],
  materials: [],
  bomByProject: {},
  bomStatusByProject: {},
  status: "idle",
  error: "",
};

// ---- Thunks ---- //

export const loadAllocationData = createAsyncThunk<
  LoadAllocationDataResult,
  void,
  { rejectValue: string }
>("adminAllocations/load", async (_, { rejectWithValue }) => {
  try {
    const projects: AllocationProject[] = [];
    const materials: AllocationMaterial[] = [];

    let projectPage = 1;
    let hasMoreProjects = true;
    while (hasMoreProjects) {
      const response = await Get(`/admin/projects${toQueryString({
        page: projectPage,
        size: 50,
      })}`);
      projects.push(...((response?.items as AllocationProject[]) || []));
      hasMoreProjects = Boolean(response?.hasNext);
      projectPage += 1;
    }

    let materialPage = 1;
    let hasMoreMaterials = true;
    while (hasMoreMaterials) {
      const response = await Get(`/materials/search${toQueryString({
        page: materialPage,
        size: 50,
      })}`);
      materials.push(...((response?.items as AllocationMaterial[]) || []));
      hasMoreMaterials = Boolean(response?.hasNext);
      materialPage += 1;
    }

    return { projects, materials };
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Unable to load allocation data";
    return rejectWithValue(message);
  }
});

export const fetchProjectBom = createAsyncThunk<
  { projectId: string; bom: BomLine[] },
  { projectId: string },
  { rejectValue: { message: string; projectId: string } }
>("adminAllocations/fetchProjectBom", async ({ projectId }, { rejectWithValue }) => {
  try {
    // Always request a large page size to fetch all BOM lines for a project.
    const data = await Get(`/bom/projects/${projectId}${toQueryString({ page: 1, size: 1000 })}`);
    /*
     * The backend now returns a PaginatedResponse<BomLineDto> for project
     * allocations. Older versions returned a list of materials under a
     * "materials" property. We attempt to read from both shapes here.
     */
    let bom: BomLine[] = [];
    if (data) {
      if (Array.isArray((data as any).materials)) {
        bom = (data as any).materials as BomLine[];
      } else if (Array.isArray((data as any).items)) {
        bom = (data as any).items as BomLine[];
      }
    }
    return { projectId, bom };
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "Unable to load project allocations";
    return rejectWithValue({ message, projectId });
  }
});

export const createProjectAllocations = createAsyncThunk<
  { projectId: string },
  {
    projectId: string;
    lines: { materialId: string; quantity: number }[];
  },
  { rejectValue: string }
>(
  "adminAllocations/createProjectAllocations",
  async ({ projectId, lines }, { rejectWithValue }) => {
    try {
      for (const line of lines) {
        await Post(`/bom/projects/${projectId}/materials`, {
          projectId,
          materialId: line.materialId,
          quantity: line.quantity,
        });
      }
      return { projectId };
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "Unable to create project allocations";
      return rejectWithValue(message);
    }
  }
);

export const updateProjectAllocation = createAsyncThunk<
  { projectId: string },
  {
    projectId: string;
    materialId: string;
    payload: any;
  },
  { rejectValue: string }
>(
  "adminAllocations/updateProjectAllocation",
  async ({ projectId, materialId, payload }, { rejectWithValue }) => {
    try {
      await Put(`/bom/projects/${projectId}/materials/${materialId}`, payload);
      return { projectId };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to update allocation";
      return rejectWithValue(message);
    }
  }
);

export const deleteProjectAllocation = createAsyncThunk<
  { projectId: string },
  { projectId: string; materialId: string | number },
  { rejectValue: string }
>(
  "adminAllocations/deleteProjectAllocation",
  async ({ projectId, materialId }, { rejectWithValue }) => {
    try {
      await Delete(`/bom/projects/${projectId}/materials/${String(materialId)}`);
      return { projectId };
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to delete allocation";
      return rejectWithValue(message);
    }
  }
);

// ---- Slice ---- //

const adminAllocationsSlice = createSlice({
  name: "adminAllocations",
  initialState,
  reducers: {
    clearAllocationError(state) {
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    builder
      // loadAllocationData
      .addCase(loadAllocationData.pending, (state) => {
        state.status = "loading";
        state.error = "";
      })
      .addCase(loadAllocationData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.projects = action.payload.projects ?? [];
        state.materials = action.payload.materials ?? [];
      })
      .addCase(loadAllocationData.rejected, (state, action) => {
        state.status = "failed";
        state.projects = [];
        state.materials = [];
        const message =
          action.payload ??
          action.error.message ??
          "Unable to load allocation data";
        state.error = message;
      })

      // fetchProjectBom
      .addCase(fetchProjectBom.pending, (state, action) => {
        const { projectId } = action.meta.arg;
        state.bomStatusByProject = {
          ...state.bomStatusByProject,
          [projectId]: "loading",
        };
        state.error = "";
      })
      .addCase(fetchProjectBom.fulfilled, (state, action) => {
        const { projectId, bom } = action.payload;
        state.bomByProject = {
          ...state.bomByProject,
          [projectId]: bom ?? [],
        };
        state.bomStatusByProject = {
          ...state.bomStatusByProject,
          [projectId]: "succeeded",
        };
      })
      .addCase(fetchProjectBom.rejected, (state, action) => {
        const { projectId } = action.meta.arg;
        const message =
          action.payload?.message ??
          action.error.message ??
          "Unable to load project allocations";
        state.bomStatusByProject = {
          ...state.bomStatusByProject,
          [projectId]: "failed",
        };
        state.error = message;
      })

      // other thunks (error only)
      .addCase(createProjectAllocations.rejected, (state, action) => {
        const message =
          action.payload ??
          action.error.message ??
          "Unable to create project allocations";
        state.error = message;
      })
      .addCase(updateProjectAllocation.rejected, (state, action) => {
        const message =
          action.payload ??
          action.error.message ??
          "Unable to update allocation";
        state.error = message;
      })
      .addCase(deleteProjectAllocation.rejected, (state, action) => {
        const message =
          action.payload ??
          action.error.message ??
          "Unable to delete allocation";
        state.error = message;
      });
  },
});

// ---- Exports ---- //

export const { clearAllocationError } = adminAllocationsSlice.actions;
export default adminAllocationsSlice.reducer;
