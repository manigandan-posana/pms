import React, { useEffect, useState, useMemo } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchMaterials,
  createMaterial,
  updateMaterial,
  deleteMaterial,
} from "../../store/slices/materialSlice";
import type { RootState, AppDispatch } from "../../store/store";
import AdminDataTable from "../../components/AdminDataTable";
import AdminFormModal from "../../components/AdminFormModal";
import { Message } from "primereact/message";
import { Button as PrimeButton } from "primereact/button";

interface Material {
  id: number | string;
  code: string;
  name: string;
  category: string;
  unit: string;
  lineType?: string;
  partNo?: string;
  minStock: number;
  currentStock: number;
  unitCost: number;
  supplier?: string;
}

interface AdminMaterialsState {
  items: Material[];
  totalItems: number;
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const unitOptions = [
  { label: "Piece(s)", value: "PIECE" },
  { label: "Kilogram(s)", value: "KG" },
  { label: "Meter(s)", value: "METER" },
  { label: "Box(es)", value: "BOX" },
  { label: "Lot(s)", value: "LOT" },
];

const categoryOptions = [
  { label: "Raw Materials", value: "RAW" },
  { label: "Semi-Finished", value: "SEMI_FINISHED" },
  { label: "Finished Goods", value: "FINISHED" },
  { label: "Components", value: "COMPONENTS" },
  { label: "Tools", value: "TOOLS" },
];

export const MaterialDirectoryPageV2: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const token = useSelector((state: RootState) => state.auth.token);

  const { items: materials, status, error } = useSelector<
    RootState,
    AdminMaterialsState
  >((state) => state.materials as any);

  const [modalVisible, setModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    category: "RAW",
    unit: "PIECE",
    minStock: 0,
    currentStock: 0,
    unitCost: 0,
    supplier: "",
  });

  // View states
  const [viewMode, setViewMode] = useState<'summary' | 'categories' | 'category-materials'>('summary');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const loading = status === "loading";

  // Calculate statistics
  const categoryGroups = useMemo(() => {
    const groups: Record<string, Material[]> = {};
    materials.forEach((material: Material) => {
      const cat = material.category || 'Uncategorized';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(material);
    });
    return groups;
  }, [materials]);

  const totalMaterials = materials.length;
  const totalCategories = Object.keys(categoryGroups).length;

  // Get materials for selected category
  const categoryMaterials = useMemo(() => {
    if (!selectedCategory) return [];
    return categoryGroups[selectedCategory] || [];
  }, [selectedCategory, categoryGroups]);

  // Load materials on mount
  useEffect(() => {
    if (token) {
      dispatch(fetchMaterials({ token }));
    }
  }, [token, dispatch]);

  // Handle form field changes
  const handleFormChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Handle add material
  const handleAddMaterial = () => {
    setEditingMaterial(null);
    setFormData({
      code: "",
      name: "",
      category: "RAW",
      unit: "PIECE",
      minStock: 0,
      currentStock: 0,
      unitCost: 0,
      supplier: "",
    });
    setModalVisible(true);
  };

  // Handle edit material
  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setFormData({
      code: material.code,
      name: material.name,
      category: material.category,
      unit: material.unit,
      minStock: material.minStock,
      currentStock: material.currentStock,
      unitCost: material.unitCost,
      supplier: material.supplier || "",
    });
    setModalVisible(true);
  };

  // Handle delete material
  const handleDeleteMaterial = async (material: Material) => {
    if (
      window.confirm(
        `Are you sure you want to delete material "${material.name}"? This action cannot be undone.`
      )
    ) {
      if (token) {
        try {
          await dispatch(
            deleteMaterial({
              token,
              materialId: String(material.id),
            })
          ).unwrap();
          toast.success("Material deleted successfully");
          dispatch(fetchMaterials({ token }));
        } catch (err: any) {
          toast.error(err || "Failed to delete material");
        }
      }
    }
  };

  // Handle save material
  const handleSaveMaterial = async () => {
    if (!formData.code.trim()) {
      toast.error("Please enter material code");
      return;
    }
    if (!formData.name.trim()) {
      toast.error("Please enter material name");
      return;
    }

    if (!token) return;

    if (editingMaterial) {
      try {
        await dispatch(
          updateMaterial({
            token,
            materialId: String(editingMaterial.id),
            payload: formData,
          })
        ).unwrap();
        toast.success("Material updated successfully");
        setModalVisible(false);
        dispatch(fetchMaterials({ token }));
      } catch (err: any) {
        toast.error(err || "Failed to update material");
      }
    } else {
      try {
        await dispatch(
          createMaterial({
            token,
            payload: formData,
          })
        ).unwrap();
        toast.success("Material created successfully");
        setModalVisible(false);
        dispatch(fetchMaterials({ token }));
      } catch (err: any) {
        toast.error(err || "Failed to create material");
      }
    }
  };

  // Table columns
  const columns = [
    {
      field: "code",
      header: "Code",
      sortable: true,
      filterable: true,
      width: "12%",
      body: (row: Material) => (
        <span className="font-mono font-semibold text-sm">{row.code}</span>
      ),
    },
    {
      field: "name",
      header: "Material Name",
      sortable: true,
      filterable: true,
      width: "20%",
      body: (row: Material) => <span className="font-medium">{row.name}</span>,
    },
    {
      field: "category",
      header: "Category",
      sortable: true,
      filterable: true,
      width: "15%",
    },
    {
      field: "unit",
      header: "Unit",
      sortable: true,
      width: "10%",
      body: (row: Material) => (
        <span className="text-sm text-gray-600">{row.unit}</span>
      ),
    },
    {
      field: "currentStock",
      header: "Stock",
      sortable: true,
      width: "10%",
      body: (row: Material) => (
        <span
          className={`font-semibold ${
            row.currentStock < row.minStock ? "text-red-600" : "text-green-600"
          }`}
        >
          {row.currentStock}
        </span>
      ),
    },
    {
      field: "minStock",
      header: "Min Stock",
      sortable: true,
      width: "10%",
      body: (row: Material) => (
        <span className="text-sm text-gray-600">{row.minStock}</span>
      ),
    },
    {
      field: "unitCost",
      header: "Unit Cost",
      sortable: true,
      width: "12%",
      body: (row: Material) => (
        <span className="font-semibold">${row.unitCost.toFixed(2)}</span>
      ),
    },
    {
      field: "supplier",
      header: "Supplier",
      sortable: true,
      filterable: true,
      width: "11%",
      body: (row: Material) => (
        <span className="text-sm">{row.supplier || "-"}</span>
      ),
    },
  ];

  const formFields = [
    {
      name: "code",
      label: "Material Code",
      type: "text" as const,
      required: true,
      placeholder: "e.g., MAT-001",
    },
    {
      name: "name",
      label: "Material Name",
      type: "text" as const,
      required: true,
      placeholder: "Enter material name",
    },
    {
      name: "category",
      label: "Category",
      type: "select" as const,
      required: true,
      options: categoryOptions,
    },
    {
      name: "unit",
      label: "Unit of Measure",
      type: "select" as const,
      required: true,
      options: unitOptions,
    },
    {
      name: "currentStock",
      label: "Current Stock",
      type: "number" as const,
      required: true,
      placeholder: "0",
    },
    {
      name: "minStock",
      label: "Minimum Stock Level",
      type: "number" as const,
      required: true,
      placeholder: "0",
    },
    {
      name: "unitCost",
      label: "Unit Cost ($)",
      type: "number" as const,
      required: true,
      placeholder: "0.00",
    },
    {
      name: "supplier",
      label: "Supplier (Optional)",
      type: "text" as const,
      placeholder: "Supplier name",
    },
  ];

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      {error && <Message severity="error" text={error} className="mb-4" />}

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div>
          <h2 className="text-2xl font-bold text-slate-800 mb-6">Material Directory</h2>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Total Materials Card */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600 uppercase tracking-wide mb-1">Total Materials</p>
                  <h3 className="text-4xl font-bold text-blue-900">{totalMaterials}</h3>
                  <p className="text-sm text-blue-700 mt-2">All materials in inventory</p>
                </div>
                <div className="bg-blue-200 p-4 rounded-full">
                  <i className="pi pi-box text-3xl text-blue-700"></i>
                </div>
              </div>
            </div>

            {/* Categories Card - Clickable */}
            <div 
              onClick={() => setViewMode('categories')}
              className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl shadow-sm cursor-pointer hover:shadow-lg hover:border-green-400 transition-all"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600 uppercase tracking-wide mb-1">Categories</p>
                  <h3 className="text-4xl font-bold text-green-900">{totalCategories}</h3>
                  <p className="text-sm text-green-700 mt-2">Click to view all categories</p>
                </div>
                <div className="bg-green-200 p-4 rounded-full">
                  <i className="pi pi-th-large text-3xl text-green-700"></i>
                </div>
              </div>
              <div className="mt-3 flex items-center text-green-700">
                <span className="text-sm font-semibold">View Categories</span>
                <i className="pi pi-arrow-right ml-2"></i>
              </div>
            </div>
          </div>

          {/* All Materials Table */}
          <AdminDataTable
            data={materials}
            columns={columns}
            title="All Materials"
            loading={loading}
            totalRecords={materials.length}
            onEdit={handleEditMaterial}
            onDelete={handleDeleteMaterial}
            onAdd={handleAddMaterial}
          />
        </div>
      )}

      {/* Categories List View */}
      {viewMode === 'categories' && (
        <div>
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-slate-800">Material Categories</h2>
            <PrimeButton
              label="Back to Summary"
              icon="pi pi-arrow-left"
              onClick={() => setViewMode('summary')}
              className="p-button-outlined"
              size="small"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(categoryGroups).map(([categoryName, items]) => (
              <div
                key={categoryName}
                onClick={() => {
                  setSelectedCategory(categoryName);
                  setViewMode('category-materials');
                }}
                className="p-6 border-2 border-slate-200 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{categoryName}</h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-100 text-blue-800">
                        {items.length} {items.length === 1 ? 'material' : 'materials'}
                      </span>
                    </div>
                  </div>
                  <i className="pi pi-angle-right text-2xl text-slate-400"></i>
                </div>
                <p className="text-sm text-slate-600">Click to view materials in this category</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Category Materials View */}
      {viewMode === 'category-materials' && selectedCategory && (
        <div>
          <div className="mb-6 flex items-center gap-3">
            <PrimeButton
              label="Back to Categories"
              icon="pi pi-arrow-left"
              onClick={() => {
                setViewMode('categories');
                setSelectedCategory(null);
              }}
              className="p-button-outlined"
              size="small"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-slate-800">
                {selectedCategory}
              </h2>
              <p className="text-sm text-slate-600">
                {categoryMaterials.length} {categoryMaterials.length === 1 ? 'material' : 'materials'} in this category
              </p>
            </div>
          </div>

          <AdminDataTable
            data={categoryMaterials}
            columns={columns}
            title=""
            loading={loading}
            totalRecords={categoryMaterials.length}
            onEdit={handleEditMaterial}
            onDelete={handleDeleteMaterial}
            onAdd={handleAddMaterial}
          />
        </div>
      )}

      <AdminFormModal
        visible={modalVisible}
        title={editingMaterial ? "Edit Material" : "Create New Material"}
        fields={formFields}
        data={formData}
        onDataChange={handleFormChange}
        onSubmit={handleSaveMaterial}
        onHide={() => setModalVisible(false)}
        loading={loading}
        submitLabel={editingMaterial ? "Update" : "Create"}
      />
    </div>
  );
};

export default MaterialDirectoryPageV2;
