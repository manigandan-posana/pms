import React, { Suspense, useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomTabs from "../../widgets/CustomTabs";
import GlobalLoader from "../../components/GlobalLoader";
import { Box } from "@mui/material";

const MaterialDirectoryPage = React.lazy(() => import("./MaterialDirectoryPage"));
const MaterialAllocationsPage = React.lazy(() => import("./MaterialAllocationsPage"));
const AllocatedMaterialsPage = React.lazy(() => import("./AllocatedMaterialsPage"));

const AdminInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const tabRoutes = [
    "/admin/inventory/materials",
    "/admin/inventory/allocations",
    "/admin/inventory/allocated",
  ];

  // Determine active index from current path
  const currentPath = location.pathname;
  let activeIndex = tabRoutes.findIndex(route => currentPath.startsWith(route));
  if (activeIndex === -1) activeIndex = 0;

  // Handle root redirect
  useEffect(() => {
    if (currentPath === "/admin/inventory" || currentPath === "/admin/inventory/") {
      navigate("/admin/inventory/materials", { replace: true });
    }
  }, [currentPath, navigate]);

  // Handle tab change and navigate
  const handleTabChange = (index: number) => {
    navigate(tabRoutes[index]);
  };

  const tabs = useMemo(
    () => [
      {
        label: "Material Directory",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <MaterialDirectoryPage />
          </Suspense>
        ),
      },
      {
        label: "Material Allocations",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <MaterialAllocationsPage />
          </Suspense>
        ),
      },
      {
        label: "Allocated Materials",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <AllocatedMaterialsPage />
          </Suspense>
        ),
      },
    ],
    []
  );

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

export default AdminInventoryPage;
