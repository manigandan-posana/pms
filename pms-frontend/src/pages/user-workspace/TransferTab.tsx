import React, { type FC, useState, type ChangeEvent } from "react";
import ModalShell from "./ModalShell";
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { Button as PrimeButton } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

export interface TransferProject {
  id: string;
  code: string;
  name: string;
}

export interface TransferMaterialRow {
  id: string;
  code: string;
  name: string;
  requiredQty: number;
  orderedQty?: number | null;
  receivedQty?: number | null;
  utilizedQty?: number | null;
  balanceQty?: number | null;
}

export interface ProjectOrderedQtyArgs {
  materialId: string;
  materialCode: string;
  fallback: number;
}

export interface TransferTabProps {
  selectedProject: TransferProject | null;
  transferCode: string;
  projects: TransferProject[];
  fromSite: string;
  onFromSiteChange?: (value: string) => void;

  transferToProjectId: string;
  onTransferToProjectChange?: (projectId: string) => void;

  toSite: string;
  onToSiteChange?: (value: string) => void;

  transferRemarks: string;
  onTransferRemarksChange?: (value: string) => void;

  materials: TransferMaterialRow[];
  pageSize: number;

  selectedIds: string[];
  onToggleSelected?: (materialId: string) => void;

  transferQty: Record<string, string>;
  onTransferQtyChange?: (materialId: string, value: string) => void;

  onSaveTransfer?: () => void;

  preventNumberScroll?: (event: React.WheelEvent<HTMLInputElement>) => void;

  getProjectOrderedQty?: (
    projectId: string | null,
    args: ProjectOrderedQtyArgs
  ) => number;

  currentProjectId: string | null;
}

const TransferTab: FC<TransferTabProps> = ({
  selectedProject,
  transferCode,
  projects,
  fromSite,
  onFromSiteChange,
  transferToProjectId,
  onTransferToProjectChange,
  toSite,
  onToSiteChange,
  transferRemarks,
  onTransferRemarksChange,
  materials,
  // pageSize,
  selectedIds,
  onToggleSelected,
  transferQty,
  onTransferQtyChange,
  onSaveTransfer,
  getProjectOrderedQty,
  currentProjectId,
}) => {
  const [editRow, setEditRow] = useState<TransferMaterialRow | null>(null);
  const [editTransferQty, setEditTransferQty] = useState<string>("");
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);

  if (!selectedProject || !projects || projects.length === 0) {
    return (
      <div className="mt-2 text-[11px] text-slate-500">
        Site-to-site transfer requires at least one project selection.
      </div>
    );
  }

  const transferProjects: TransferProject[] = projects || [];

  const openEditModal = (m: TransferMaterialRow) => {
    setEditRow(m);
    setEditTransferQty(transferQty[m.id] ?? "");
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditRow(null);
    setEditTransferQty("");
  };

  const handleSaveEditRow = () => {
    if (!editRow) return;
    const id = editRow.id;
    const value = editTransferQty;
    const numeric = Number(value || 0);

    // update quantity map
    onTransferQtyChange?.(id, value);

    const alreadySelected = selectedIds.includes(id);

    // use existing toggle logic carefully
    if (numeric > 0 && !alreadySelected) {
      onToggleSelected?.(id);
    } else if (numeric <= 0 && alreadySelected) {
      onToggleSelected?.(id);
    }

    closeEditModal();
  };

  const handleFromSiteChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFromSiteChange?.(event.target.value);
  };

  const handleToSiteChange = (event: ChangeEvent<HTMLInputElement>) => {
    onToSiteChange?.(event.target.value);
  };

  const handleTransferRemarksChange = (event: ChangeEvent<HTMLInputElement>) => {
    onTransferRemarksChange?.(event.target.value);
  };

  const handleTransferToProjectChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    onTransferToProjectChange?.(event.target.value);
  };

  return (
    <div className="mt-2 space-y-2">
      {/* top form unchanged */}
      <div className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3 lg:grid-cols-6">
        <div>
          <div className="mb-1 text-xs text-slate-500 font-medium">Code</div>
          <InputText
            value={transferCode}
            disabled
            className="w-full font-mono"
            size="small"
          />
        </div>
        <div>
          <div className="mb-1 text-xs text-slate-500 font-medium">From Project</div>
          <div className="rounded border border-slate-200 bg-slate-50 px-2 py-1 text-xs">
            {selectedProject
              ? `${selectedProject.code} – ${selectedProject.name}`
              : "Select project"}
          </div>
        </div>
        <div>
          <div className="mb-1 text-xs text-slate-500 font-medium">From Site</div>
          <InputText
            value={fromSite}
            onChange={handleFromSiteChange}
            className="w-full"
            placeholder="Site name / area"
            size="small"
          />
        </div>
        <div>
          <div className="mb-1 text-xs text-slate-500 font-medium">To Project</div>
          <Dropdown
            value={transferToProjectId}
            onChange={(e: any) => handleTransferToProjectChange({ target: { value: e.value } } as any)}
            options={[
              { label: "Select project", value: "" },
              ...transferProjects.map((p: any) => ({
                label: `${p.code} – ${p.name}`,
                value: p.id
              }))
            ]}
            className="w-full"
            size="small"
          />
        </div>
        <div>
          <div className="mb-1 text-xs text-slate-500 font-medium">To Site</div>
          <InputText
            value={toSite}
            onChange={handleToSiteChange}
            className="w-full"
            placeholder="Destination site"
            size="small"
          />
        </div>
        <div className="md:col-span-1 lg:col-span-2">
          <div className="mb-1 text-xs text-slate-500 font-medium">Remarks</div>
          <InputText
            value={transferRemarks}
            onChange={handleTransferRemarksChange}
            className="w-full"
            size="small"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px]">
        <div className="text-slate-500">Sel: <span className="font-semibold text-slate-900">{selectedIds.length}</span></div>
        <PrimeButton
          label="Transfer"
          icon="pi pi-exchange"
          onClick={onSaveTransfer}
          disabled={!transferToProjectId || selectedIds.length === 0}
          className={(!transferToProjectId || selectedIds.length === 0) ? 'p-button-plain p-button-sm p-disabled' : 'p-button-sm'}
        />
      </div>

      {/* MATERIALS TABLE – PrimeReact DataTable */}
      <div className="overflow-x-auto rounded-sm border border-slate-200 p-2">
        {/* @ts-ignore */}
        <DataTable
          value={materials}
          dataKey="id"
          responsiveLayout="scroll"
          selectionMode="multiple"
          selection={materials.filter((m) => selectedIds.includes(m.id))}
          onSelectionChange={(e: any) => {
            const newSelection = e.value as any[];
            const newIds = newSelection.map((s) => s.id);
            if (onToggleSelected) {
              const added = newIds.filter((id) => !selectedIds.includes(id));
              const removed = selectedIds.filter((id) => !newIds.includes(id));
              added.forEach((id) => onToggleSelected(id));
              removed.forEach((id) => onToggleSelected(id));
            }
          }}
          onRowClick={(e) => openEditModal(e.data as TransferMaterialRow)}
        >
          <Column header="Code" field="code" body={(row: any) => <span className="font-mono">{row.code}</span>} style={{ width: "150px", minWidth: "150px" }} />
          <Column header="Material" field="name" />
          <Column header="Required" body={(r:any) => String(r.requiredQty)} style={{ textAlign: 'right' }} />
          <Column header="Ordered" body={(r:any) => String(getProjectOrderedQty?.(currentProjectId, { materialId: r.id, materialCode: r.code, fallback: Number(r.orderedQty ?? 0) }) ?? r.orderedQty ?? 0)} style={{ textAlign: 'right' }} />
          <Column
            header="Received"
            body={(r: any) => String(r.receivedQty ?? 0)}
            style={{ textAlign: 'right' }}
          />
          <Column
            header="Issued"
            body={(r: any) => String(r.utilizedQty ?? 0)}
            style={{ textAlign: 'right' }}
          />
          <Column
            header="Stock"
            body={(r: any) =>
              String(
                typeof r.balanceQty === 'number'
                  ? r.balanceQty
                  : Math.max(
                      0,
                      Number(r.receivedQty || 0) - Number(r.utilizedQty || 0)
                    )
              )
            }
            style={{ textAlign: 'right' }}
          />
          <Column
            header="Transfer Qty"
            body={(r: any) => String(transferQty[r.id] ?? 0)}
            style={{ textAlign: 'right' }}
          />
        </DataTable>
      </div>

      {/* EDIT TRANSFER QTY MODAL */}
      <ModalShell
        open={isEditModalOpen}
        title={
          editRow
            ? `Transfer · ${editRow.code} – ${editRow.name}`
            : "Transfer Quantity"
        }
        onClose={closeEditModal}
        footer={
          <div className="flex items-center justify-end gap-2 text-[11px]">
            <button
              type="button"
              onClick={closeEditModal}
              className="rounded border border-slate-200 px-3 py-1 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveEditRow}
              className="rounded border border-indigo-500 px-3 py-1 text-indigo-700 hover:bg-indigo-50"
            >
              Save
            </button>
          </div>
        }
      >
        {editRow && (
          <div className="space-y-3 text-[11px] text-slate-600">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] text-slate-500">Code</div>
                <div className="font-mono">{editRow.code}</div>
              </div>
              <div>
                <div className="text-[10px] text-slate-500">Material</div>
                <div>{editRow.name}</div>
              </div>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-[10px] text-slate-500">Transfer quantity</span>
              <InputNumber
                value={editTransferQty === "" ? undefined : Number(editTransferQty)}
                onValueChange={(e) => setEditTransferQty(e.value == null ? "" : String(e.value))}
                mode="decimal"
                className="w-full"
              />
            </label>
          </div>
        )}
      </ModalShell>
    </div>
  );
};

export default TransferTab;
