import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Box, Tabs, Tab, Typography, Paper } from "@mui/material";
import MaterialDirectoryPage from "./MaterialDirectoryPage";
import ProjectManagementPage from "./ProjectManagementPage";
import SupplierManagementPage from "../workspace/SupplierManagementPage";
import ContractorDirectoryPage from "../contractors/ContractorDirectoryPage";
import UserManagementPage from "./UserManagementPage";
import { FiDatabase, FiGrid, FiTruck, FiUsers, FiUser } from "react-icons/fi";

interface TabPanelProps {
    children?: React.ReactNode;
    index: number;
    value: number;
}

function CustomTabPanel(props: TabPanelProps) {
    const { children, value, index, ...other } = props;

    return (
        <div
            role="tabpanel"
            hidden={value !== index}
            id={`master-tabpanel-${index}`}
            aria-labelledby={`master-tab-${index}`}
            {...other}
            style={{ height: '100%' }}
        >
            {value === index && (
                <Box sx={{ height: '100%', pt: 1 }}>
                    {children}
                </Box>
            )}
        </div>
    );
}

const MasterDashboardPage = () => {
    const location = useLocation();
    const [value, setValue] = useState(0);

    useEffect(() => {
        if (location.state?.tab !== undefined) {
            setValue(location.state.tab);
        }
    }, [location.state]);

    const handleChange = (event: React.SyntheticEvent, newValue: number) => {
        setValue(newValue);
    };

    return (
        <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Paper square elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', px: 1 }}>
                <Tabs
                    value={value}
                    onChange={handleChange}
                    aria-label="master console tabs"
                    textColor="primary"
                    indicatorColor="primary"
                    sx={{ minHeight: 32 }}
                >
                    <Tab icon={<FiDatabase />} iconPosition="start" label="Material Directory" sx={{ minHeight: 32, py: 0.5 }} />
                    <Tab icon={<FiGrid />} iconPosition="start" label="Project Management" sx={{ minHeight: 32, py: 0.5 }} />
                    <Tab icon={<FiTruck />} iconPosition="start" label="Supplier Management" sx={{ minHeight: 32, py: 0.5 }} />
                    <Tab icon={<FiUsers />} iconPosition="start" label="Contractor Management" sx={{ minHeight: 32, py: 0.5 }} />
                    <Tab icon={<FiUser />} iconPosition="start" label="User Management" sx={{ minHeight: 32, py: 0.5 }} />
                </Tabs>
            </Paper>

            <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
                <CustomTabPanel value={value} index={0}>
                    <MaterialDirectoryPage />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={1}>
                    <ProjectManagementPage />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={2}>
                    {/* Passing a prop to indicate admin mode if possible, otherwise we rely on routing or context */}
                    <SupplierManagementPage isAdminMode={true} />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={3}>
                    <ContractorDirectoryPage isAdminMode={true} />
                </CustomTabPanel>
                <CustomTabPanel value={value} index={4}>
                    <UserManagementPage />
                </CustomTabPanel>
            </Box>
        </Box>
    );
};

export default MasterDashboardPage;
