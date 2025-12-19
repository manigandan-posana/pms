import React, { useMemo, useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import toast from "react-hot-toast";
import { submitProcurementRequest } from "../../store/slices/workspaceSlice";
import {
  setProcurementField,
  setProcurementSaving,
} from "../../store/slices/workspaceUiSlice";
import { listProcurementRequests } from "../../store/slices/procurementSlice";
import type { RootState } from "../../store/store";
import type { AppDispatch } from "../../store/store";
import CustomTable, { type ColumnDef } from "../../widgets/CustomTable";
import CustomTextField from "../../widgets/CustomTextField";
import CustomSelect from "../../widgets/CustomSelect";
import CustomButton from "../../widgets/CustomButton";

// ---------- Local types for the slices this page uses ---------- //

interface ProjectSummary {
  id: string | number;
  code: string;
  name: string;
}

interface Material {
  id: string | number;
  code: string;
  name: string;
  category?: string | null;
  unit?: string | null;
  [key: string]: unknown;
}

interface ProcurementRequest {
  id: string | number;
  projectName: string;
  materialName: string;
  increaseQty: number;
  status: string;
  reason: string;
  [key: string]: unknown;
}

interface WorkspaceStateShape {
  procurementRequests: ProcurementRequest[];
  assignedProjects: ProjectSummary[];
  materials: Material[];
  [key: string]: unknown;
}

interface ProcurementUiState {
  projectId: string;
  materialId: string;
  increaseQty: string;
  reason: string;
  saving: boolean;
}

interface WorkspaceUiStateShape {
  procurement: ProcurementUiState;
  [key: string]: unknown;
}

// ---------- Component ---------- //

const ProcurementPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();

  const { assignedProjects, materials } = useSelector<
    RootState,
    WorkspaceStateShape
  >((state) => state.workspace as unknown as WorkspaceStateShape);

  const { projectId, materialId, increaseQty, reason, saving } = useSelector<
    RootState,
    ProcurementUiState
  >(
    (state) =>
      (state.workspaceUi as unknown as WorkspaceUiStateShape)
        .procurement as ProcurementUiState
  );

  const materialOptions = useMemo<Material[]>(
    () => [...materials].sort((a, b) => a.name.localeCompare(b.name)),
    [materials]
  );

  // Local state for paginated procurement requests
  const [page, setPage] = useState<number>(0);
  const [pageSize, setPageSize] = useState<number>(10);
  const [procurementRows, setProcurementRows] = useState<ProcurementRequest[]>([]);
  const [totalItems, setTotalItems] = useState<number>(0);

  // Fetch paginated procurement requests whenever page or pageSize changes
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const response = await dispatch(listProcurementRequests({
          page: page + 1,
          size: pageSize,
        })).unwrap();
        const items = (response?.items ?? []) as ProcurementRequest[];
        setProcurementRows(items);
        setTotalItems(response?.totalItems ?? items.length);
      } catch (error) {
        setProcurementRows([]);
        setTotalItems(0);
      }
    };
    void fetchRequests();
  }, [page, pageSize, dispatch]);

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    e.preventDefault();

    if (!projectId || !materialId || !increaseQty || !reason) {
      toast.error("Project, material, quantity and reason are required");
      return;
    }

    dispatch(setProcurementSaving(true));
    try {
      await dispatch(
        submitProcurementRequest({
          payload: {
            projectId,
            materialId,
            increaseQty: Number(increaseQty),
            reason,
          },
        })
      ).unwrap();
      toast.success("Request submitted to backend");

      dispatch(setProcurementField({ field: "materialId", value: "" }));
      dispatch(setProcurementField({ field: "increaseQty", value: "" }));
      dispatch(setProcurementField({ field: "reason", value: "" }));
      // We might want to refresh the list, but it's separate.
    } catch (err: unknown) {
      console.error("Procurement request failed:", err);
    } finally {
      dispatch(setProcurementSaving(false));
    }
  };

  const columns: ColumnDef<ProcurementRequest>[] = [
    { header: "Project", field: "projectName", body: (r) => r.projectName || "—" },
    { header: "Material", field: "materialName", body: (r) => r.materialName || "—" },
    { header: "Quantity", field: "increaseQty", align: "right" },
    { header: "Status", field: "status" },
    { header: "Reason", field: "reason" },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xs font-semibold text-slate-800">Procurement</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <form
          onSubmit={handleSubmit}
          className="space-y-4 p-4"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <CustomSelect
                label="Project"
                value={projectId}
                options={assignedProjects.map((p) => ({ label: `${p.code} — ${p.name}`, value: String(p.id) }))}
                onChange={(value) => dispatch(setProcurementField({ field: 'projectId', value: String(value) }))}
              />
            </div>
            <div>
              <CustomSelect
                label="Material"
                value={materialId}
                options={materialOptions.map((m) => ({ label: `${m.code} — ${m.name}`, value: String(m.id) }))}
                onChange={(value) => dispatch(setProcurementField({ field: 'materialId', value: String(value) }))}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <CustomTextField
                label="Quantity needed"
                type="number"
                value={increaseQty}
                onChange={(e) => dispatch(setProcurementField({ field: 'increaseQty', value: e.target.value }))}
                required
              />
            </div>
            <div>
              <CustomTextField
                label="Reason"
                value={reason}
                onChange={(e) => dispatch(setProcurementField({ field: 'reason', value: e.target.value }))}
                required
              />
            </div>
          </div>
          <div className="flex justify-end">
            <CustomButton
              type="submit"
              disabled={saving}
            >
              {saving ? 'Submitting…' : 'Submit Request'}
            </CustomButton>
          </div>
        </form>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-2 text-xs font-semibold text-slate-700">
          Requests
        </div>
        <div>
          <CustomTable
            data={procurementRows}
            columns={columns}
            pagination
            rows={pageSize}
            page={page}
            totalRecords={totalItems}
            onPageChange={(p, size) => {
              setPage(p);
              setPageSize(size);
            }}
            rowsPerPageOptions={[10, 20, 50]}
            emptyMessage="No procurement requests yet."
          />
        </div>
      </div>
    </div>
  );
};

export default ProcurementPage;
