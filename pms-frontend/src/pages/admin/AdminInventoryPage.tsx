import React, { Suspense, useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomTabs from "../../widgets/CustomTabs";
import GlobalLoader from "../../components/GlobalLoader";

const MaterialDirectoryPage = React.lazy(() => import("./MaterialDirectoryPage"));
const MaterialAllocationsPage = React.lazy(() => import("./MaterialAllocationsPage"));
const AllocatedMaterialsPage = React.lazy(() => import("./AllocatedMaterialsPage"));

const AdminInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  // Map tab indices to routes
  const tabRoutes = useMemo(
    () => [
      "/admin/inventory/materials",
      "/admin/inventory/allocations",
      "/admin/inventory/allocated",
    ],
    []
  );

  // Sync active tab with current route
  useEffect(() => {
    const currentPath = location.pathname;

    if (currentPath === "/admin/inventory" || currentPath === "/admin/inventory/") {
      // Default to Material Directory tab
      if (activeIndex !== 0) {
        setActiveIndex(0);
      }
      navigate("/admin/inventory/materials", { replace: true });
    } else {
      const index = tabRoutes.findIndex(route => currentPath.startsWith(route));
      if (index !== -1 && index !== activeIndex) {
        setActiveIndex(index);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigate]);

  // Handle tab change and navigate
  const handleTabChange = (index: number) => {
    setActiveIndex(index);
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
    <div className="admin-inventory-page">
      <CustomTabs
        tabs={tabs}
        activeIndex={activeIndex}
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default AdminInventoryPage;
