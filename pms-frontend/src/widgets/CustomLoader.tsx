
import React from 'react';
import { CircularProgress, Box, Typography, Backdrop } from '@mui/material';

interface CustomLoaderProps {
    message?: string;
    fullScreen?: boolean;
    size?: number;
    color?: string; // hex color or 'primary', 'secondary' etc if using theme palette
}

const CustomLoader: React.FC<CustomLoaderProps> = ({
    message = "Loading...",
    fullScreen = false,
    size = 40,
    color = '#2563eb' // Default blue-600 to match theme
}) => {
    const LoaderContent = (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                p: 3
            }}
        >
            <CircularProgress
                size={size}
                thickness={4}
                sx={{
                    color: color,
                    '& .MuiCircularProgress-circle': {
                        strokeLinecap: 'round',
                    },
                }}
            />
            {message && (
                <Typography
                    variant="body2"
                    sx={{
                        color: '#64748b',
                        fontWeight: 500,
                        animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        '@keyframes pulse': {
                            '0%, 100%': { opacity: 1 },
                            '50%': { opacity: .5 },
                        }
                    }}
                >
                    {message}
                </Typography>
            )}
        </Box>
    );

    if (fullScreen) {
        return (
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1, backgroundColor: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(4px)' }}
                open={true}
            >
                {LoaderContent}
            </Backdrop>
        );
    }

    return (
        <Box
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                minHeight: 200
            }}
        >
            {LoaderContent}
        </Box>
    );
};

export default CustomLoader;
