import React, { Suspense, useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomTabs from "../../widgets/CustomTabs";
import GlobalLoader from "../../components/GlobalLoader";

const BomPage = React.lazy(() => import("./BomPage"));
const InwardPage = React.lazy(() => import("./InwardPage"));
const OutwardPage = React.lazy(() => import("./OutwardPage"));
const TransferPage = React.lazy(() => import("./TransferPage"));

const InventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  // Map tab indices to routes
  const tabRoutes = useMemo(
    () => [
      "/workspace/inventory/bom",
      "/workspace/inventory/inwards",
      "/workspace/inventory/outwards",
      "/workspace/inventory/transfers",
    ],
    []
  );

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
  }, [activeIndex, location.pathname, navigate, tabRoutes]);

  // Handle tab change and navigate
  const handleTabChange = (index: number) => {
    setActiveIndex(index);
    navigate(tabRoutes[index]);
  };

  const tabs = useMemo(
    () => [
      {
        label: "BOM",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <BomPage />
          </Suspense>
        ),
      },
      {
        label: "Inwards",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <InwardPage />
          </Suspense>
        ),
      },
      {
        label: "Outwards",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <OutwardPage />
          </Suspense>
        ),
      },
      {
        label: "Transfers",
        content: (
          <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
            <TransferPage />
          </Suspense>
        ),
      },
    ],
    []
  );

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
