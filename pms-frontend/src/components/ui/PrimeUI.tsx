import React from 'react';
import { Button as PrimeButton } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { MultiSelect } from 'primereact/multiselect';
import { DataTable } from 'primereact/datatable';
import type { DataTableProps } from 'primereact/datatable';

export const Button: React.FC<React.ComponentProps<typeof PrimeButton>> = (props) => (
  <PrimeButton {...props} />
);

export const TextInput: React.FC<React.ComponentProps<typeof InputText>> = (props) => (
  <InputText {...props} />
);

export const Modal: React.FC<{
  header?: React.ReactNode;
  visible: boolean;
  onHide: () => void;
  footer?: React.ReactNode;
  children?: React.ReactNode;
}> = ({ header, visible, onHide, footer, children }) => (
  <Dialog header={header} visible={visible} onHide={onHide} footer={footer} blockScroll>
    {children}
  </Dialog>
);

export const MultiSelectInput: React.FC<React.ComponentProps<typeof MultiSelect>> = (props) => (
  <MultiSelect {...props} />
);

export const PrimeDataTable = DataTable as unknown as React.FC<DataTableProps<any>>;

export default {
  Button,
  TextInput,
  Modal,
  MultiSelectInput,
  PrimeDataTable,
};
