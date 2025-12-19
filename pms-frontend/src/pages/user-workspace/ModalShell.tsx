import { type FC, type ReactNode } from "react";
import { Dialog } from 'primereact/dialog';

export interface ModalShellProps {
  open: boolean;
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode | null;
}

const ModalShell: FC<ModalShellProps> = ({
  open,
  title,
  onClose,
  children,
  footer = null,
}) => {
  return (
    <Dialog
      header={title}
      visible={open}
      onHide={onClose}
      modal
      blockScroll
      draggable={false}
      resizable={false}
      style={{ width: 'min(100%, 960px)' }}
      footer={footer ? <div>{footer}</div> : undefined}
    >
      <div className="max-h-[70vh] overflow-y-auto py-3 text-slate-600">{children}</div>
    </Dialog>
  );
};

export default ModalShell;
