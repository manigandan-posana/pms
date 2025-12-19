import React from 'react';
import { Button } from '@mui/material';
import type { ButtonProps } from '@mui/material';

interface CustomButtonProps extends ButtonProps {
  label?: string;
}

const CustomButton: React.FC<CustomButtonProps> = ({ label, children, ...props }) => {
  return (
    <Button
      variant="contained"
      size="small"
      style={{
        textTransform: 'none',
        fontWeight: 500,
        boxShadow: 'none',
        ...props.style
      }}
      {...props}
    >
      {label || children}
    </Button>
  );
};

export default CustomButton;
