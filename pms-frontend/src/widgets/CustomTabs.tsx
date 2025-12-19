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
    const [visitedTabs, setVisitedTabs] = useState<Set<number>>(new Set([controlledIndex !== undefined ? controlledIndex : defaultIndex]));

    const activeIndex = controlledIndex !== undefined ? controlledIndex : internalIndex;

    // Update visited tabs whenever active index changes
    React.useEffect(() => {
        setVisitedTabs(prev => {
            const newSet = new Set(prev);
            if (!newSet.has(activeIndex)) {
                newSet.add(activeIndex);
                return newSet;
            }
            return prev;
        });
    }, [activeIndex]);

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
                <Tabs value={activeIndex} onChange={handleChange} aria-label="custom tabs">
                    {tabs.map((tab, index) => (
                        <Tab key={index} label={tab.label} id={`simple-tab-${index}`} aria-controls={`simple-tabpanel-${index}`} />
                    ))}
                </Tabs>
            </Box>
            {tabs.map((tab, index) => {
                // Only render if the tab has been visited at least once
                if (!visitedTabs.has(index)) return null;

                return (
                    <div
                        key={index}
                        role="tabpanel"
                        hidden={activeIndex !== index}
                        id={`simple-tabpanel-${index}`}
                        aria-labelledby={`simple-tab-${index}`}
                        style={{ display: activeIndex === index ? 'block' : 'none' }}
                    >
                        <Box sx={{ p: 3 }}>
                            {tab.content}
                        </Box>
                    </div>
                );
            })}
        </Box>
    );
};

export default CustomTabs;
