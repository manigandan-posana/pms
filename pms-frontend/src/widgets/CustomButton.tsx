import React from 'react';
import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';

interface CustomButtonProps extends ButtonProps {
  label?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({ label, children, sx, ...props }) => {
  return (
    <Button
      variant="contained"
      size="small"
      sx={{
        textTransform: 'none',
        fontWeight: 500,
        boxShadow: 'none',
        fontSize: '0.75rem',
        py: 0.5,
        px: 1.5,
        minHeight: 28,
        '&:hover': {
          boxShadow: 1
        },
        ...sx
      }}
      {...props}
    >
      {label || children}
    </Button>
  );
};

export default CustomButton;
