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
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs
                    value={activeIndex}
                    onChange={handleChange}
                    aria-label="custom tabs"
                    sx={{
                        minHeight: 36,
                        '& .MuiTab-root': {
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            fontWeight: 500,
                            color: 'text.secondary',
                            minHeight: 36,
                            py: 0.75,
                            px: 1.5,
                            '&.Mui-selected': {
                                color: 'primary.main',
                                fontWeight: 600
                            }
                        },
                        '& .MuiTabs-indicator': {
                            height: 2
                        }
                    }}
                >
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab.label} id={`simple-tab-${index}`} aria-controls={`simple-tabpanel-${index}`} />
                    ))}
                </Tabs>
            </Box>
            {tabs.map((tab, index) => (
                <div
                    key={index}
                    role="tabpanel"
                    hidden={activeIndex !== index}
                    id={`simple-tabpanel-${index}`}
                    aria-labelledby={`simple-tab-${index}`}
                    style={{ display: activeIndex === index ? 'block' : 'none' }}
                >
                    <Box sx={{ p: 1 }}>
                        {tab.content}
                    </Box>
                </div>
            ))}
        </Box>
    );
};

export default CustomTabs;
