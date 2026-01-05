import { Get, Post, Put, Delete } from "./utils/apiService";
import type { PaginatedResponse, ProjectDto } from "./types/backend";

// Admin Projects API
export const adminProjectsApi = {
  listProjects: (params?: any) => Get<PaginatedResponse<ProjectDto>>('/admin/projects', params),
  createProject: (data: any) => Post('/admin/projects', data),
  updateProject: (id: string, data: any) => Put(`/admin/projects/${id}`, data),
  deleteProject: (id: string) => Delete(`/admin/projects/${id}`),
  getProjectDetails: (id: string) => Get(`/admin/projects/${id}`),
};

// History API
export const historyApi = {
  searchInwardHistory: (params?: any) => Get('/history/inward', params),
  searchOutwardHistory: (params?: any) => Get('/history/outward', params),
  searchTransferHistory: (params?: any) => Get('/history/transfer', params),
};