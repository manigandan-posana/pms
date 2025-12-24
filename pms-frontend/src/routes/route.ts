// src/routes/route.ts
import type { ElementType } from "react";
import { lazy } from "react";

// Lazy‑loaded workspace pages. Using React.lazy ensures code splitting and
// defers loading until the route is visited. Wrapped with Suspense in
// RouteComponent to provide fallback UI.
const InventoryPage = lazy(() => import("../pages/workspace/InventoryPage"));
const BomPage = lazy(() => import("../pages/workspace/BomPage"));
const InwardPage = lazy(() => import("../pages/workspace/InwardPage"));
const InwardCreatePage = lazy(() => import("../pages/workspace/InwardCreatePage"));
const InwardDetailPage = lazy(() => import("../pages/workspace/InwardDetailPage"));
const OutwardPage = lazy(() => import("../pages/workspace/OutwardPage"));
const OutwardCreatePage = lazy(() => import("../pages/workspace/OutwardCreatePage"));
const OutwardDetailPage = lazy(() => import("../pages/workspace/OutwardDetailPage"));
const TransferPage = lazy(() => import("../pages/workspace/TransferPage"));
const TransferCreatePage = lazy(() => import("../pages/workspace/TransferCreatePage"));
const TransferDetailPage = lazy(() => import("../pages/workspace/TransferDetailPage"));
const VehicleManagementPage = lazy(() => import("../pages/workspace/VehicleManagementPage"));
const VehicleDetailsPage = lazy(() => import("../pages/workspace/VehicleDetailsPage"));
const UserDashboardPage = lazy(() => import("../pages/workspace/UserDashboardPage"));

// Lazy‑loaded admin pages
const AdminInventoryPage = lazy(() => import("../pages/admin/AdminInventoryPage"));
const AllocatedMaterialsManagementPage = lazy(() => import("../pages/admin/AllocatedMaterialsManagementPage"));
const ProjectManagementPage = lazy(() => import("../pages/admin/ProjectManagementPage"));
const UserManagementPage = lazy(() => import("../pages/admin/UserManagementPage"));
const UnifiedProjectDetailsPage = lazy(() => import("../pages/admin/UnifiedProjectDetailsPage"));
const AdminInwardDetailPage = lazy(() => import("../pages/admin/AdminInwardDetailPage"));
const AdminOutwardDetailPage = lazy(() => import("../pages/admin/AdminOutwardDetailPage"));
const AdminTransferDetailPage = lazy(() => import("../pages/admin/AdminTransferDetailPage"));

// ----- Route types -----

export interface IRouteConfig {
  path: string;              // path relative to parent (for nested routes)
  component: ElementType;
  layout?: ElementType;      // optional layout wrapper, if you want to use it later
}

// ----- Path constants -----

export const loginPath = "/";
export const workspacePath = "/workspace";
export const adminBasePath = "/admin";
export const adminDashboardPath = "/admin/project-details";
export const adminMaterialsPath = "/admin/materials";
export const adminAllocatedMaterialsPath = "/admin/allocated-materials";

// ----- Workspace nested routes (/workspace/...) -----

export const workspaceRoutes: IRouteConfig[] = [
  { path: "dashboard", component: UserDashboardPage },
  { path: "inventory", component: InventoryPage },
  { path: "inventory/bom", component: InventoryPage },
  { path: "inventory/inwards", component: InventoryPage },
  { path: "inventory/outwards", component: InventoryPage },
  { path: "inventory/transfers", component: InventoryPage },
  { path: "bom", component: BomPage },
  { path: "inward", component: InwardPage },
  { path: "inward/create", component: InwardCreatePage },
  { path: "inward/detail/:id", component: InwardDetailPage },
  { path: "outward", component: OutwardPage },
  { path: "outward/create", component: OutwardCreatePage },
  { path: "outward/detail/:id", component: OutwardDetailPage },
  { path: "transfer", component: TransferPage },
  { path: "transfer/create", component: TransferCreatePage },
  { path: "transfer/detail/:id", component: TransferDetailPage },
  { path: "vehicles", component: VehicleManagementPage },
  { path: "vehicles/:vehicleId", component: VehicleDetailsPage },
];

// ----- Admin nested routes (/admin/...) -----

export const adminRoutes: IRouteConfig[] = [
  { path: "project-details", component: UnifiedProjectDetailsPage },
  { path: "inward/:id", component: AdminInwardDetailPage },
  { path: "outward/:id", component: AdminOutwardDetailPage },
  { path: "transfer/:id", component: AdminTransferDetailPage },
  { path: "inventory", component: AdminInventoryPage },
  { path: "inventory/materials", component: AdminInventoryPage },
  { path: "inventory/allocations", component: AdminInventoryPage },
  { path: "inventory/allocated", component: AdminInventoryPage },
  { path: "allocated-materials", component: AllocatedMaterialsManagementPage },
  { path: "projects", component: ProjectManagementPage },
  { path: "users", component: UserManagementPage },
];
