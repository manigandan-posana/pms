import React, { Suspense, useMemo, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import CustomTabs from "../../widgets/CustomTabs";
import GlobalLoader from "../../components/GlobalLoader";
import { Box } from "@mui/material";

const VehicleDirectoryPage = React.lazy(() => import("./VehicleDirectoryPage.tsx"));
const FuelManagementPage = React.lazy(() => import("./FuelManagementPage.tsx"));
const DailyLogPage = React.lazy(() => import("./DailyLogPage.tsx"));
const SupplierManagementPage = React.lazy(() => import("./SupplierManagementPage.tsx"));

const VehicleManagementPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeIndex, setActiveIndex] = useState(0);

    // Map tab indices to routes
    const tabRoutes = useMemo(
        () => [
            "/workspace/vehicles/directory",
            "/workspace/vehicles/fuel",
            "/workspace/vehicles/daily-log",
            "/workspace/vehicles/suppliers",
        ],
        []
    );

    // Sync active tab with current route
    useEffect(() => {
        const currentPath = location.pathname;

        if (currentPath === "/workspace/vehicles" || currentPath === "/workspace/vehicles/") {
            // Default to Vehicle Directory tab
            if (activeIndex !== 0) {
                setActiveIndex(0);
            }
            navigate("/workspace/vehicles/directory", { replace: true });
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
                label: "Vehicle Directory",
                content: (
                    <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
                        <VehicleDirectoryPage />
                    </Suspense>
                ),
            },
            {
                label: "Fuel Management",
                content: (
                    <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
                        <FuelManagementPage />
                    </Suspense>
                ),
            },
            {
                label: "Daily Logs",
                content: (
                    <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
                        <DailyLogPage />
                    </Suspense>
                ),
            },
            {
                label: "Suppliers",
                content: (
                    <Suspense fallback={<GlobalLoader overlay={false} className="py-12" />}>
                        <SupplierManagementPage />
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

export default VehicleManagementPage;
