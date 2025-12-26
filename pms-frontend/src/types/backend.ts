// Auto-generated frontend types matching backend DTOs (store DTOs)

export interface TransferLineRequest {
  materialId: string | number;
  transferQty: number;
}

export interface TransferRequest {
  code?: string | null;
  fromProjectId: string | number;
  toProjectId: string | number;
  fromSite?: string | null;
  toSite?: string | null;
  remarks?: string | null;
  lines: TransferLineRequest[];
}

export interface TransferLineDto {
  materialId: string | number;
  transferQty: number;
}

export interface TransferRecordDto {
  id?: string | number;
  code?: string;
  fromProjectId?: string | number | null;
  fromProjectName?: string | null;
  fromSite?: string | null;
  toProjectId?: string | number | null;
  toProjectName?: string | null;
  toSite?: string | null;
  remarks?: string | null;
  transferDate?: string | null; // yyyy-MM-dd
  lines?: TransferLineDto[];
}

export interface InventoryCodesResponse {
  inwardCode?: string;
  outwardCode?: string;
  transferCode?: string;
}

export interface ProjectDto {
  id: string | number;
  code?: string;
  name?: string;
}

export interface BomLineDto {
  id?: string | number;
  materialId?: string | number;
  code?: string;
  name?: string;
  unit?: string;
  quantity?: number;
  allocatedQty?: number;
  orderedQty?: number;
  receivedQty?: number;
  utilizedQty?: number;
  balanceQty?: number;
}

export interface MaterialDto {
  id?: string | number;
  code?: string;
  name?: string;
  unit?: string;
  qty?: number;
  balanceQty?: number;
}

export interface OutwardLineRequest {
  materialId: string | number;
  issueQty: number;
}

export interface OutwardRequest {
  code?: string | null;
  projectId: string | number;
  issueTo?: string | null;
  status?: string | null;
  date?: string | null;
  closeDate?: string | null;
  remarks?: string | null;
  lines: OutwardLineRequest[];
}

export interface InwardLineRequest {
  materialId: string | number;
  orderedQty: number;
  receivedQty: number;
}

export interface InwardRequest {
  code?: string | null;
  projectId: string | number;
  type?: string | null;
  date?: string | null;
  closeDate?: string | null;
  invoiceNo?: string | null;
  supplierName?: string | null;
  remarks?: string | null;
  lines: InwardLineRequest[];
}

export interface PaginatedResponse<T> {
  page: number;
  size: number;
  total: number;
  items: T[];
}

export interface ProjectActivityEntryDto {
  id?: string;
  code?: string | null;
  date?: string | null;
  subject?: string | null;
  status?: string | null;
  lineCount?: number | null;
  direction?: string | null;
}

export interface ProjectActivityDto {
  projectId: number | string;
  projectCode?: string | null;
  projectName?: string | null;
  inwardCount: number;
  outwardCount: number;
  transferCount: number;
  recentInwards: ProjectActivityEntryDto[];
  recentOutwards: ProjectActivityEntryDto[];
  recentTransfers: ProjectActivityEntryDto[];
}
