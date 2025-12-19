import React from "react";
import {
  FiEdit2,
  FiTrash2,
  FiDownload,
  FiUpload,
  FiPlus,
  FiEye,
  FiCopy,
} from "react-icons/fi";

interface CompactButtonProps {
  icon?: React.ReactNode;
  label?: string;
  tooltip?: string;
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  severity?: "success" | "info" | "warning" | "danger" | "secondary";
  className?: string;
  size?: "small" | "large";
  outlined?: boolean;
}

export const CompactEditButton: React.FC<CompactButtonProps> = ({
  tooltip = "Edit",
  onClick,
  disabled,
  loading,
}) => (
  <button
    className="p-button p-button-text p-button-sm p-component inline-flex items-center justify-center"
    onClick={onClick}
    disabled={disabled || loading}
    title={tooltip}
    type="button"
  >
    {loading ? <i className="pi pi-spin pi-spinner" /> : <FiEdit2 size={14} />}
  </button>
);

export const CompactDeleteButton: React.FC<CompactButtonProps> = ({
  tooltip = "Delete",
  onClick,
  disabled,
  loading,
}) => (
  <button
    className="p-button p-button-text p-button-danger p-button-sm p-component inline-flex items-center justify-center"
    onClick={onClick}
    disabled={disabled || loading}
    title={tooltip}
    type="button"
  >
    {loading ? <i className="pi pi-spin pi-spinner" /> : <FiTrash2 size={14} />}
  </button>
);

export const CompactExportButton: React.FC<CompactButtonProps> = ({
  label = "Export",
  tooltip = "Export data",
  onClick,
  disabled,
  loading,
}) => (
  <button
    className="p-button p-button-outlined p-button-sm p-component inline-flex items-center justify-center gap-2"
    onClick={onClick}
    disabled={disabled || loading}
    title={tooltip}
    type="button"
  >
    {loading ? <i className="pi pi-spin pi-spinner" /> : <FiDownload size={14} />}
    {label && <span>{label}</span>}
  </button>
);

export const CompactImportButton: React.FC<CompactButtonProps> = ({
  label = "Import",
  tooltip = "Import data",
  onClick,
  disabled,
  loading,
}) => (
  <button
    className="p-button p-button-outlined p-button-sm p-component inline-flex items-center justify-center gap-2"
    onClick={onClick}
    disabled={disabled || loading}
    title={tooltip}
    type="button"
  >
    {loading ? <i className="pi pi-spin pi-spinner" /> : <FiUpload size={14} />}
    {label && <span>{label}</span>}
  </button>
);

export const CompactAddButton: React.FC<CompactButtonProps> = ({
  label = "Add",
  tooltip = "Add new",
  onClick,
  disabled,
  loading,
}) => (
  <button
    className="p-button p-button-sm p-component inline-flex items-center justify-center gap-2"
    onClick={onClick}
    disabled={disabled || loading}
    title={tooltip}
    type="button"
  >
    {loading ? <i className="pi pi-spin pi-spinner" /> : <FiPlus size={14} />}
    {label && <span>{label}</span>}
  </button>
);

export const CompactIconButton: React.FC<CompactButtonProps> = ({
  icon,
  tooltip,
  onClick,
  disabled,
  loading,
  severity,
  className = "",
}) => (
  <button
    className={`p-button p-button-text p-button-sm p-component inline-flex items-center justify-center ${severity ? `p-button-${severity}` : ""} ${className}`}
    onClick={onClick}
    disabled={disabled || loading}
    title={tooltip}
    type="button"
  >
    {loading ? <i className="pi pi-spin pi-spinner" /> : icon}
  </button>
);

export const TableActionButtons: React.FC<{
  onEdit?: () => void;
  onDelete?: () => void;
  onView?: () => void;
  onCopy?: () => void;
  editDisabled?: boolean;
  deleteDisabled?: boolean;
}> = ({ onEdit, onDelete, onView, onCopy, editDisabled, deleteDisabled }) => (
  <div className="flex items-center gap-1">
    {onView && (
      <button
        className="p-button p-button-text p-button-sm p-component inline-flex items-center justify-center"
        onClick={onView}
        title="View"
        type="button"
      >
        <FiEye size={14} />
      </button>
    )}
    {onEdit && (
      <button
        className="p-button p-button-text p-button-sm p-component inline-flex items-center justify-center"
        onClick={onEdit}
        disabled={editDisabled}
        title="Edit"
        type="button"
      >
        <FiEdit2 size={14} />
      </button>
    )}
    {onCopy && (
      <button
        className="p-button p-button-text p-button-sm p-component inline-flex items-center justify-center"
        onClick={onCopy}
        title="Copy"
        type="button"
      >
        <FiCopy size={14} />
      </button>
    )}
    {onDelete && (
      <button
        className="p-button p-button-text p-button-danger p-button-sm p-component inline-flex items-center justify-center"
        onClick={onDelete}
        disabled={deleteDisabled}
        title="Delete"
        type="button"
      >
        <FiTrash2 size={14} />
      </button>
    )}
  </div>
);
