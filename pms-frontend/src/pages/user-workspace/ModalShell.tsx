
import { type FC, type ReactNode } from "react";
import CustomModal from "../../widgets/CustomModal";

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
    <CustomModal
      open={open}
      onClose={onClose}
      title={title}
      maxWidth="md"
      fullWidth
      footer={footer}
    >
      <div className="max-h-[70vh] overflow-y-auto text-slate-600">
        {children}
      </div>
    </CustomModal>
  );
};

export default ModalShell;
