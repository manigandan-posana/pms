// Vehicle API Service
import { Get, Post, Put, Delete } from "../utils/apiService";
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
} from "../types/vehicle";

const BASE_URL = "/vehicles";

// Vehicle APIs
export const vehicleApi = {
  // Vehicles
  getAllVehicles: () => Get<Vehicle[]>(`${BASE_URL}`),
  
  getVehiclesByProject: (projectId: number) =>
    Get<Vehicle[]>(`${BASE_URL}/project/${projectId}`),
  
  getVehicleById: (id: number) =>
    Get<Vehicle>(`${BASE_URL}/${id}`),
  
  createVehicle: (data: CreateVehicleRequest) =>
    Post<Vehicle>(`${BASE_URL}`, data),
  
  updateVehicle: (id: number, data: CreateVehicleRequest) =>
    Put<Vehicle>(`${BASE_URL}/${id}`, data),
  
  updateVehicleStatus: (id: number, data: UpdateVehicleStatusRequest) =>
    Put<Vehicle>(`${BASE_URL}/${id}/status`, data),
  
  deleteVehicle: (id: number) =>
    Delete<void>(`${BASE_URL}/${id}`),

  // Fuel Entries
  getAllFuelEntries: () =>
    Get<FuelEntry[]>(`${BASE_URL}/fuel-entries`),
  
  getFuelEntriesByProject: (projectId: number) =>
    Get<FuelEntry[]>(`${BASE_URL}/fuel-entries/project/${projectId}`),
  
  getFuelEntriesByProjectAndStatus: (projectId: number, status: string) =>
    Get<FuelEntry[]>(`${BASE_URL}/fuel-entries/project/${projectId}/status/${status}`),
  
  getFuelEntriesByDateRange: (projectId: number, startDate: string, endDate: string) =>
    Get<FuelEntry[]>(
      `${BASE_URL}/fuel-entries/project/${projectId}/range?startDate=${startDate}&endDate=${endDate}`
    ),
  
  getFuelEntryById: (id: number) =>
    Get<FuelEntry>(`${BASE_URL}/fuel-entries/${id}`),
  
  createFuelEntry: (data: CreateFuelEntryRequest) =>
    Post<FuelEntry>(`${BASE_URL}/fuel-entries`, data),
  
  closeFuelEntry: (id: number, data: CloseFuelEntryRequest) =>
    Put<FuelEntry>(`${BASE_URL}/fuel-entries/${id}/close`, data),
  
  deleteFuelEntry: (id: number) =>
    Delete<void>(`${BASE_URL}/fuel-entries/${id}`),

  // Suppliers
  getAllSuppliers: () =>
    Get<Supplier[]>(`${BASE_URL}/suppliers`),
  
  getSuppliersByProject: (projectId: number) =>
    Get<Supplier[]>(`${BASE_URL}/suppliers/project/${projectId}`),
  
  createSupplier: (data: CreateSupplierRequest) =>
    Post<Supplier>(`${BASE_URL}/suppliers`, data),
  
  bulkAssignSuppliers: (data: { ids: number[]; projectIds: number[] }) =>
    Post<void>(`${BASE_URL}/suppliers/bulk-assign`, data),
  
  deleteSupplier: (id: number) =>
    Delete<void>(`${BASE_URL}/suppliers/${id}`),

  // Daily Logs
  getAllDailyLogs: () =>
    Get<DailyLog[]>(`${BASE_URL}/daily-logs`),
  
  getDailyLogsByProject: (projectId: number) =>
    Get<DailyLog[]>(`${BASE_URL}/daily-logs/project/${projectId}`),
  
  getDailyLogsByProjectAndDate: (projectId: number, date: string) =>
    Get<DailyLog[]>(`${BASE_URL}/daily-logs/project/${projectId}/date/${date}`),
  
  createDailyLog: (data: CreateDailyLogRequest) =>
    Post<DailyLog>(`${BASE_URL}/daily-logs`, data),
  
  closeDailyLog: (id: number, data: CloseDailyLogRequest) =>
    Put<DailyLog>(`${BASE_URL}/daily-logs/${id}/close`, data),
};
