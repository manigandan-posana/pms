import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomTabs from "../../widgets/CustomTabs";
import BomPage from "./BomPage";
import InwardPage from "./InwardPage";
import OutwardPage from "./OutwardPage";
import TransferPage from "./TransferPage";

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  // Map tab indices to routes
  const tabRoutes = [
    "/workspace/inventory/bom",
    "/workspace/inventory/inwards",
    "/workspace/inventory/outwards",
    "/workspace/inventory/transfers",
  ];

  // Sync active tab with current route
  useEffect(() => {
    const currentPath = location.pathname;

    if (currentPath === "/workspace/inventory" || currentPath === "/workspace/inventory/") {
      // Default to BOM tab
      setActiveIndex(0);
      navigate("/workspace/inventory/bom", { replace: true });
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

  const tabs = React.useMemo(() => [
    { label: "BOM", content: <BomPage /> },
    { label: "Inwards", content: <InwardPage /> },
    { label: "Outwards", content: <OutwardPage /> },
    { label: "Transfers", content: <TransferPage /> }
  ], []);

  return (
    <div className="inventory-page">
      <CustomTabs
        tabs={tabs}
        activeIndex={activeIndex}
        onTabChange={handleTabChange}
      />
    </div>
  );
};

export default InventoryPage;
