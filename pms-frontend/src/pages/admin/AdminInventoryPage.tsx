import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomTabs from "../../widgets/CustomTabs";
import MaterialDirectoryPage from "./MaterialDirectoryPage";
import MaterialAllocationsPage from "./MaterialAllocationsPage";
import AllocatedMaterialsPage from "./AllocatedMaterialsPage";

const AdminInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  // Map tab indices to routes
  const tabRoutes = [
    "/admin/inventory/materials",
    "/admin/inventory/allocations",
    "/admin/inventory/allocated",
  ];

  // Sync active tab with current route
  useEffect(() => {
    const currentPath = location.pathname;

    if (currentPath === "/admin/inventory" || currentPath === "/admin/inventory/") {
      // Default to Material Directory tab
      setActiveIndex(0);
      navigate("/admin/inventory/materials", { replace: true });
    } else {
      const index = tabRoutes.findIndex(route => currentPath.startsWith(route));
      if (index !== -1 && index !== activeIndex) {
        setActiveIndex(index);
      }
    }
  }, [location.pathname]);

  // Handle tab change and navigate
  const handleTabChange = (index: number) => {
    setActiveIndex(index);
    navigate(tabRoutes[index]);
  };

  const tabs = [
    { label: "Material Directory", content: <MaterialDirectoryPage /> },
    { label: "Material Allocations", content: <MaterialAllocationsPage /> },
    { label: "Allocated Materials", content: <AllocatedMaterialsPage /> }
  ];

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
