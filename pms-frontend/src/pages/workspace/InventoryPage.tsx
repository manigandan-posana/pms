import React, { Suspense, useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import CustomTabs from "../../widgets/CustomTabs";
import GlobalLoader from "../../components/GlobalLoader";
import { Box } from "@mui/material";
import type { RootState } from "../../store/store";

const BomPage = React.lazy(() => import("./BomPage"));
const InwardPage = React.lazy(() => import("./InwardPage"));
const OutwardPage = React.lazy(() => import("./OutwardPage"));
const TransferPage = React.lazy(() => import("./TransferPage"));
const MaterialAllocationsPage = React.lazy(() => import("../admin/MaterialAllocationsPage"));
const AllocatedMaterialsPage = React.lazy(() => import("../admin/AllocatedMaterialsPage"));

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { role, permissions } = useSelector((state: RootState) => state.auth);
  const [activeIndex, setActiveIndex] = useState(0);

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (role === "ADMIN") return true;
    return (permissions || []).includes(permission);
  };

  const tabs = useMemo(() => {
    const allTabs = [
      {
        label: "Material Allocations",
        route: "/workspace/inventory/allocations",
        requiredPermission: "MATERIAL_ALLOCATION",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <MaterialAllocationsPage />
          </Suspense>
        ),
      },
      {
        label: "Allocated Materials",
        route: "/workspace/inventory/allocated",
        requiredPermission: "ALLOCATED_MATERIALS_VIEW",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <AllocatedMaterialsPage />
          </Suspense>
        ),
      },
      {
        label: "BOM",
        route: "/workspace/inventory/bom",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <BomPage />
          </Suspense>
        ),
      },
      {
        label: "Inwards",
        route: "/workspace/inventory/inwards",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <InwardPage />
          </Suspense>
        ),
      },
      {
        label: "Outwards",
        route: "/workspace/inventory/outwards",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <OutwardPage />
          </Suspense>
        ),
      },
      {
        label: "Transfers",
        route: "/workspace/inventory/transfers",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <TransferPage />
          </Suspense>
        ),
      },
    ];

    return allTabs.filter((tab) => hasPermission(tab.requiredPermission));
  }, [permissions, role]);

  const tabRoutes = useMemo(() => tabs.map((tab) => tab.route), [tabs]);

  // Sync active tab with current route
  useEffect(() => {
    const currentPath = location.pathname;

    if (tabs.length === 0) return;

    if (currentPath === "/workspace/inventory" || currentPath === "/workspace/inventory/") {
      if (activeIndex !== 0) {
        setActiveIndex(0);
      }
      navigate(tabRoutes[0], { replace: true });
    } else {
      const index = tabRoutes.findIndex(route => currentPath.startsWith(route));
      if (index !== -1 && index !== activeIndex) {
        setActiveIndex(index);
      }
      if (index === -1) {
        navigate(tabRoutes[0], { replace: true });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigate, tabs]);

  // Handle tab change and navigate
  const handleTabChange = (index: number) => {
    setActiveIndex(index);
    navigate(tabRoutes[index]);
  };

  return (
    <Box>
      <CustomTabs
        tabs={tabs}
        activeIndex={activeIndex}
        onTabChange={handleTabChange}
      />
    </Box>
  );
};

export default InventoryPage;
