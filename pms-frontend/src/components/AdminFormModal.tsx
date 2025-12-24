import React from "react";
import CustomModal from "../widgets/CustomModal";
import CustomButton from "../widgets/CustomButton";
import CustomTextField from "../widgets/CustomTextField";
import CustomSelect from "../widgets/CustomSelect";
import { Checkbox, FormControlLabel } from "@mui/material";

interface FormField {
  name: string;
  label: string;
  type: "text" | "email" | "password" | "number" | "select" | "textarea" | "checkbox" | "date";
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[];
  multiple?: boolean;
  validation?: (value: any) => string | null;
  disabled?: boolean;
  className?: string;
}

interface AdminFormModalProps {
  visible: boolean;
  title: string;
  fields: FormField[];
  data: Record<string, any>;
  onDataChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onHide: () => void;
  loading?: boolean;
  error?: string;
  submitLabel?: string;
}

export const AdminFormModal: React.FC<AdminFormModalProps> = ({
  visible,
  title,
  fields,
  data,
  onDataChange,
  onSubmit,
  onHide,
  loading = false,
  error,
  submitLabel = "Save",
}) => {
  const [validationErrors, setValidationErrors] = React.useState<Record<string, string>>({});

  const validateField = (field: FormField, value: any) => {
    if (field.required && !value && value !== 0 && field.type !== 'checkbox') {
      return `${field.label} is required`;
    }
    if (field.validation) {
      return field.validation(value) || null;
    }
    return null;
  };

  const handleFieldChange = (field: FormField, value: any) => {
    const error = validateField(field, value);
    if (error) {
      setValidationErrors({ ...validationErrors, [field.name]: error });
    } else {
      const newErrors = { ...validationErrors };
      delete newErrors[field.name];
      setValidationErrors(newErrors);
    }
    onDataChange(field.name, value);
  };

  const handleSubmit = () => {
    const newErrors: Record<string, string> = {};
    fields.forEach((field) => {
      const error = validateField(field, data[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (Object.keys(newErrors).length > 0) {
      setValidationErrors(newErrors);
      return;
    }

    onSubmit();
  };

  const renderField = (field: FormField) => {
    const value = data[field.name] || "";
    const hasError = validationErrors[field.name];

    switch (field.type) {
      case "select":
        return (
          <div key={field.name} className="mb-4">
            <CustomSelect
              label={field.label}
              value={value}
              onChange={(val) => handleFieldChange(field, val)}
              options={field.options || []}
              disabled={field.disabled || loading}
              required={field.required}
              multiple={field.multiple}
              // error={!!hasError} // CustomSelect doesn't have explicit error prop shown in previous edit, let's assume it handles it or I ignored it.
              // Wait, CustomSelect definition: `error?: boolean; helperText?: string;`. Yes.
              error={!!hasError}
              helperText={hasError}
            />
          </div>
        );
      case "textarea":
        return (
          <div key={field.name} className="mb-4">
            <CustomTextField
              label={field.label}
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              disabled={field.disabled || loading}
              required={field.required}
              multiline
              rows={4}
              error={!!hasError}
              helperText={hasError}
              placeholder={field.placeholder}
            />
          </div>
        );
      case "checkbox":
        return (
          <div key={field.name} className="mb-4">
            <FormControlLabel
              control={
                <Checkbox
                  checked={!!value}
                  onChange={(e) => handleFieldChange(field, e.target.checked)}
                  disabled={field.disabled || loading}
                />
              }
              label={field.label}
            />
            {hasError && <p className="text-xs text-red-500 mt-1">{hasError}</p>}
          </div>
        );
      default:
        // text, email, password, number, date
        return (
          <div key={field.name} className="mb-4">
            <CustomTextField
              label={field.label}
              type={field.type}
              value={value}
              onChange={(e) => handleFieldChange(field, e.target.value)}
              disabled={field.disabled || loading}
              required={field.required}
              error={!!hasError}
              helperText={hasError}
              placeholder={field.placeholder}
            />
          </div>
        );
    }
  };

  return (
    <CustomModal
      open={visible}
      onClose={onHide}
      title={title}
      footer={
        <div className="flex gap-2 justify-end">
          <CustomButton
            variant="outlined"
            onClick={onHide}
            disabled={loading}
          >
            Cancel
          </CustomButton>
          <CustomButton
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : submitLabel}
          </CustomButton>
        </div>
      }
    >
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-4 text-xs border border-red-200">
          {error}
        </div>
      )}
      <div className="form-content pt-2">
        {fields.map((field) => renderField(field))}
      </div>
    </CustomModal>
  );
};

export default AdminFormModal;
