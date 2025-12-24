import React, { useState } from 'react';
import { Tabs, Tab, Box } from '@mui/material';

export interface TabItem {
    label: string;
    content: React.ReactNode;
}

interface CustomTabsProps {
    tabs: TabItem[];
    defaultIndex?: number;
    activeIndex?: number;
    onTabChange?: (index: number) => void;
}

const CustomTabs: React.FC<CustomTabsProps> = ({ tabs, defaultIndex = 0, activeIndex: controlledIndex, onTabChange }) => {
    const [internalIndex, setInternalIndex] = useState(defaultIndex);

    const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

    const handleChange = (_: React.SyntheticEvent, newValue: number) => {
        if (controlledIndex === undefined) {
            setInternalIndex(newValue);
        }
        if (onTabChange) {
            onTabChange(newValue);
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: '#e0e0e0' }}>
                <Tabs
                    value={activeIndex}
                    onChange={handleChange}
                    aria-label="custom tabs"
                    sx={{
                        '& .MuiTab-root': {
                            fontSize: '14px',
                            textTransform: 'none',
                            fontWeight: 500,
                            color: '#666666',
                            minHeight: 48,
                            '&.Mui-selected': {
                                color: '#0a7326',
                                fontWeight: 600
                            }
                        },
                        '& .MuiTabs-indicator': {
                            backgroundColor: '#0a7326',
                            height: 3
                        }
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab.label} id={`simple-tab-${index}`} aria-controls={`simple-tabpanel-${index}`} />
                    ))}
                </Tabs>
            </Box>
            {/* Only render the active tab content */}
            <div
                role="tabpanel"
                id={`simple-tabpanel-${activeIndex}`}
                aria-labelledby={`simple-tab-${activeIndex}`}
            >
                <Box sx={{ p: 3 }}>
                    {tabs[activeIndex]?.content}
                </Box>
            </div>
        </Box>
    );
};

export default CustomTabs;
