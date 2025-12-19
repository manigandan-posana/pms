import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { Get, Post, Put, Delete } from "../../utils/apiService";
import type {
  Vehicle,
  FuelEntry,
  Supplier,
  DailyLog,
  CreateVehicleRequest,
  UpdateVehicleStatusRequest,
  CreateFuelEntryRequest,
  CloseFuelEntryRequest,
  CreateSupplierRequest,
  CreateDailyLogRequest,
  CloseDailyLogRequest,
} from "../../types/vehicle";

// ---- Types ---- //

export type VehicleStatus = "idle" | "loading" | "succeeded" | "failed";

export interface VehicleState {
  vehicles: Vehicle[];
  fuelEntries: FuelEntry[];
  suppliers: Supplier[];
  dailyLogs: DailyLog[];
  status: VehicleStatus;
  error: string;
}

// ---- Initial State ---- //

const initialState: VehicleState = {
  vehicles: [],
  fuelEntries: [],
  suppliers: [],
  dailyLogs: [],
  status: "idle",
  error: "",
};

// ---- Thunks ---- //

// Vehicle Thunks
export const fetchVehiclesByProject = createAsyncThunk<
  Vehicle[],
  number,
  { rejectValue: string }
>("vehicles/fetchByProject", async (projectId, { rejectWithValue }) => {
  try {
    const data = await Get<Vehicle[]>(`/vehicles/project/${projectId}`);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to fetch vehicles";
    return rejectWithValue(message);
  }
});

export const createVehicle = createAsyncThunk<
  Vehicle,
  CreateVehicleRequest,
  { rejectValue: string }
>("vehicles/create", async (payload, { rejectWithValue }) => {
  try {
    const data = await Post<Vehicle>("/vehicles", payload);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to create vehicle";
    return rejectWithValue(message);
  }
});

export const updateVehicle = createAsyncThunk<
  Vehicle,
  { id: number; data: CreateVehicleRequest },
  { rejectValue: string }
>("vehicles/update", async ({ id, data }, { rejectWithValue }) => {
  try {
    const result = await Put<Vehicle>(`/vehicles/${id}`, data);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to update vehicle";
    return rejectWithValue(message);
  }
});

export const updateVehicleStatus = createAsyncThunk<
  Vehicle,
  { id: number; data: UpdateVehicleStatusRequest },
  { rejectValue: string }
>("vehicles/updateStatus", async ({ id, data }, { rejectWithValue }) => {
  try {
    const result = await Put<Vehicle>(`/vehicles/${id}/status`, data);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to update vehicle status";
    return rejectWithValue(message);
  }
});

export const deleteVehicle = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("vehicles/delete", async (id, { rejectWithValue }) => {
  try {
    await Delete<void>(`/vehicles/${id}`);
    return id;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to delete vehicle";
    return rejectWithValue(message);
  }
});

// Fuel Entry Thunks
export const fetchFuelEntriesByProject = createAsyncThunk<
  FuelEntry[],
  number,
  { rejectValue: string }
>("vehicles/fetchFuelEntriesByProject", async (projectId, { rejectWithValue }) => {
  try {
    const data = await Get<FuelEntry[]>(`/vehicles/fuel-entries/project/${projectId}`);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to fetch fuel entries";
    return rejectWithValue(message);
  }
});

export const createFuelEntry = createAsyncThunk<
  FuelEntry,
  CreateFuelEntryRequest,
  { rejectValue: string }
>("vehicles/createFuelEntry", async (payload, { rejectWithValue }) => {
  try {
    const data = await Post<FuelEntry>("/vehicles/fuel-entries", payload);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to create fuel entry";
    return rejectWithValue(message);
  }
});

export const closeFuelEntry = createAsyncThunk<
  FuelEntry,
  { id: number; data: CloseFuelEntryRequest },
  { rejectValue: string }
>("vehicles/closeFuelEntry", async ({ id, data }, { rejectWithValue }) => {
  try {
    const result = await Put<FuelEntry>(`/vehicles/fuel-entries/${id}/close`, data);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to close fuel entry";
    return rejectWithValue(message);
  }
});

export const deleteFuelEntry = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("vehicles/deleteFuelEntry", async (id, { rejectWithValue }) => {
  try {
    await Delete<void>(`/vehicles/fuel-entries/${id}`);
    return id;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to delete fuel entry";
    return rejectWithValue(message);
  }
});

// Supplier Thunks
export const fetchSuppliersByProject = createAsyncThunk<
  Supplier[],
  number,
  { rejectValue: string }
>("vehicles/fetchSuppliersByProject", async (projectId, { rejectWithValue }) => {
  try {
    const data = await Get<Supplier[]>(`/vehicles/suppliers/project/${projectId}`);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to fetch suppliers";
    return rejectWithValue(message);
  }
});

export const createSupplier = createAsyncThunk<
  Supplier,
  CreateSupplierRequest,
  { rejectValue: string }
>("vehicles/createSupplier", async (payload, { rejectWithValue }) => {
  try {
    const data = await Post<Supplier>("/vehicles/suppliers", payload);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to create supplier";
    return rejectWithValue(message);
  }
});

export const deleteSupplier = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>("vehicles/deleteSupplier", async (id, { rejectWithValue }) => {
  try {
    await Delete<void>(`/vehicles/suppliers/${id}`);
    return id;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to delete supplier";
    return rejectWithValue(message);
  }
});

// Daily Log Thunks
export const fetchDailyLogsByProject = createAsyncThunk<
  DailyLog[],
  number,
  { rejectValue: string }
>("vehicles/fetchDailyLogsByProject", async (projectId, { rejectWithValue }) => {
  try {
    const data = await Get<DailyLog[]>(`/vehicles/daily-logs/project/${projectId}`);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to fetch daily logs";
    return rejectWithValue(message);
  }
});

export const createDailyLog = createAsyncThunk<
  DailyLog,
  CreateDailyLogRequest,
  { rejectValue: string }
>("vehicles/createDailyLog", async (payload, { rejectWithValue }) => {
  try {
    const data = await Post<DailyLog>("/vehicles/daily-logs", payload);
    return data;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to create daily log";
    return rejectWithValue(message);
  }
});

export const closeDailyLog = createAsyncThunk<
  DailyLog,
  { id: number; data: CloseDailyLogRequest },
  { rejectValue: string }
>("vehicles/closeDailyLog", async ({ id, data }, { rejectWithValue }) => {
  try {
    const result = await Put<DailyLog>(`/vehicles/daily-logs/${id}/close`, data);
    return result;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to close daily log";
    return rejectWithValue(message);
  }
});

// Load all vehicle data for a project
export const loadVehicleData = createAsyncThunk<
  { vehicles: Vehicle[]; fuelEntries: FuelEntry[]; suppliers: Supplier[]; dailyLogs: DailyLog[] },
  number,
  { rejectValue: string }
>("vehicles/loadAll", async (projectId, { rejectWithValue }) => {
  try {
    const [vehicles, fuelEntries, suppliers, dailyLogs] = await Promise.all([
      Get<Vehicle[]>(`/vehicles/project/${projectId}`),
      Get<FuelEntry[]>(`/vehicles/fuel-entries/project/${projectId}`),
      Get<Supplier[]>(`/vehicles/suppliers/project/${projectId}`),
      Get<DailyLog[]>(`/vehicles/daily-logs/project/${projectId}`),
    ]);

    return { vehicles, fuelEntries, suppliers, dailyLogs };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unable to load vehicle data";
    return rejectWithValue(message);
  }
});

// ---- Slice ---- //

const vehicleSlice = createSlice({
  name: "vehicles",
  initialState,
  reducers: {
    clearVehicles: (state) => {
      state.vehicles = [];
      state.fuelEntries = [];
      state.suppliers = [];
      state.dailyLogs = [];
      state.status = "idle";
      state.error = "";
    },
  },
  extraReducers: (builder) => {
    // Load all vehicle data
    builder
      .addCase(loadVehicleData.pending, (state) => {
        state.status = "loading";
      })
      .addCase(loadVehicleData.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.vehicles = action.payload.vehicles;
        state.fuelEntries = action.payload.fuelEntries;
        state.suppliers = action.payload.suppliers;
        state.dailyLogs = action.payload.dailyLogs;
        state.error = "";
      })
      .addCase(loadVehicleData.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to load vehicle data";
      });

    // Fetch vehicles by project
    builder
      .addCase(fetchVehiclesByProject.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchVehiclesByProject.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.vehicles = action.payload;
      })
      .addCase(fetchVehiclesByProject.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to fetch vehicles";
      });

    // Create vehicle
    builder
      .addCase(createVehicle.fulfilled, (state, action) => {
        state.vehicles.push(action.payload);
      })
      .addCase(createVehicle.rejected, (state, action) => {
        state.error = action.payload || "Failed to create vehicle";
      });

    // Update vehicle
    builder
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const index = state.vehicles.findIndex((v) => v.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
      })
      .addCase(updateVehicle.rejected, (state, action) => {
        state.error = action.payload || "Failed to update vehicle";
      });

    // Update vehicle status
    builder
      .addCase(updateVehicleStatus.fulfilled, (state, action) => {
        const index = state.vehicles.findIndex((v) => v.id === action.payload.id);
        if (index !== -1) {
          state.vehicles[index] = action.payload;
        }
      })
      .addCase(updateVehicleStatus.rejected, (state, action) => {
        state.error = action.payload || "Failed to update vehicle status";
      });

    // Delete vehicle
    builder
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.vehicles = state.vehicles.filter((v) => v.id !== action.payload);
      })
      .addCase(deleteVehicle.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete vehicle";
      });

    // Fetch fuel entries
    builder
      .addCase(fetchFuelEntriesByProject.fulfilled, (state, action) => {
        state.fuelEntries = action.payload;
      })
      .addCase(fetchFuelEntriesByProject.rejected, (state, action) => {
        state.error = action.payload || "Failed to fetch fuel entries";
      });

    // Create fuel entry
    builder
      .addCase(createFuelEntry.fulfilled, (state, action) => {
        state.fuelEntries.push(action.payload);
      })
      .addCase(createFuelEntry.rejected, (state, action) => {
        state.error = action.payload || "Failed to create fuel entry";
      });

    // Close fuel entry
    builder
      .addCase(closeFuelEntry.fulfilled, (state, action) => {
        const index = state.fuelEntries.findIndex((f) => f.id === action.payload.id);
        if (index !== -1) {
          state.fuelEntries[index] = action.payload;
        }
      })
      .addCase(closeFuelEntry.rejected, (state, action) => {
        state.error = action.payload || "Failed to close fuel entry";
      });

    // Delete fuel entry
    builder
      .addCase(deleteFuelEntry.fulfilled, (state, action) => {
        state.fuelEntries = state.fuelEntries.filter((f) => f.id !== action.payload);
      })
      .addCase(deleteFuelEntry.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete fuel entry";
      });

    // Fetch suppliers
    builder
      .addCase(fetchSuppliersByProject.fulfilled, (state, action) => {
        state.suppliers = action.payload;
      })
      .addCase(fetchSuppliersByProject.rejected, (state, action) => {
        state.error = action.payload || "Failed to fetch suppliers";
      });

    // Create supplier
    builder
      .addCase(createSupplier.fulfilled, (state, action) => {
        state.suppliers.push(action.payload);
      })
      .addCase(createSupplier.rejected, (state, action) => {
        state.error = action.payload || "Failed to create supplier";
      });

    // Delete supplier
    builder
      .addCase(deleteSupplier.fulfilled, (state, action) => {
        state.suppliers = state.suppliers.filter((s) => s.id !== action.payload);
      })
      .addCase(deleteSupplier.rejected, (state, action) => {
        state.error = action.payload || "Failed to delete supplier";
      });

    // Fetch daily logs
    builder
      .addCase(fetchDailyLogsByProject.fulfilled, (state, action) => {
        state.dailyLogs = action.payload;
      })
      .addCase(fetchDailyLogsByProject.rejected, (state, action) => {
        state.error = action.payload || "Failed to fetch daily logs";
      });

    // Create daily log
    builder
      .addCase(createDailyLog.fulfilled, (state, action) => {
        state.dailyLogs.push(action.payload);
      })
      .addCase(createDailyLog.rejected, (state, action) => {
        state.error = action.payload || "Failed to create daily log";
      });

    // Close daily log
    builder
      .addCase(closeDailyLog.fulfilled, (state, action) => {
        const index = state.dailyLogs.findIndex((d) => d.id === action.payload.id);
        if (index !== -1) {
          state.dailyLogs[index] = action.payload;
        }
      })
      .addCase(closeDailyLog.rejected, (state, action) => {
        state.error = action.payload || "Failed to close daily log";
      });
  },
});

export const { clearVehicles } = vehicleSlice.actions;
export default vehicleSlice.reducer;
