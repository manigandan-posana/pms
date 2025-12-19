// Vehicle types for PMS frontend

export type ProjectId = number | string;
export type FuelType = "PETROL" | "DIESEL" | "ELECTRIC";
export type VehicleType = "OWN_VEHICLE" | "RENT_MONTHLY" | "RENT_DAILY" | "RENT_HOURLY";
export type VehicleStatus = "ACTIVE" | "INACTIVE" | "PLANNED";
export type EntryStatus = "OPEN" | "CLOSED";
export type RentPeriod = "MONTHLY" | "DAILY" | "HOURLY";

export interface Vehicle {
  id: number;
  projectId: number;
  projectCode: string;
  projectName: string;
  vehicleName: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  fuelType: FuelType;
  status: VehicleStatus;
  startDate: string;
  endDate?: string;
  rentPrice?: number;
  rentPeriod?: RentPeriod;
  createdAt: string;
  updatedAt: string;
  statusHistory?: StatusHistory[];
}

export interface StatusHistory {
  id: number;
  status: VehicleStatus;
  startDate: string;
  endDate?: string;
  reason: string;
}

export interface FuelEntry {
  id: number;
  date: string;
  projectId: number;
  projectCode: string;
  vehicleId: number;
  vehicleName: string;
  vehicleNumber: string;
  fuelType: FuelType;
  supplierId: number;
  supplierName: string;
  litres: number;
  openingKm: number;
  closingKm?: number;
  distance?: number;
  mileage?: number;
  status: EntryStatus;
  openingKmPhoto?: string;
  closingKmPhoto?: string;
  pricePerLitre: number;
  totalCost: number;
  createdAt: string;
  updatedAt: string;
}

export interface Supplier {
  id: number;
  projectId: number;
  projectCode: string;
  supplierName: string;
  contactPerson?: string;
  phoneNumber?: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyLog {
  id: number;
  date: string;
  projectId: number;
  projectCode: string;
  vehicleId: number;
  vehicleName: string;
  vehicleNumber: string;
  openingKm: number;
  closingKm?: number;
  distance?: number;
  status: EntryStatus;
  openingKmPhoto?: string;
  closingKmPhoto?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateVehicleRequest {
  projectId: number;
  vehicleName: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  fuelType: FuelType;
  status: VehicleStatus;
  startDate: string;
  endDate?: string;
  rentPrice?: number;
  rentPeriod?: RentPeriod;
}

export interface UpdateVehicleStatusRequest {
  status: VehicleStatus;
  statusChangeDate: string;
  reason: string;
}

export interface CreateFuelEntryRequest {
  date: string;
  projectId: number;
  vehicleId: number;
  supplierId: number;
  litres: number;
  openingKm: number;
  openingKmPhoto?: string;
  pricePerLitre: number;
}

export interface CloseFuelEntryRequest {
  closingKm: number;
  closingKmPhoto?: string;
}

export interface CreateSupplierRequest {
  projectId: number;
  supplierName: string;
  contactPerson?: string;
  phoneNumber?: string;
  address?: string;
}

export interface CreateDailyLogRequest {
  date: string;
  projectId: number;
  vehicleId: number;
  openingKm: number;
  openingKmPhoto?: string;
}

export interface CloseDailyLogRequest {
  closingKm: number;
  closingKmPhoto?: string;
}
