import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { FiGrid, FiList, FiPlus } from "react-icons/fi";

import ProjectAllocationManager from "../../components/ProjectAllocationManager";
import {
  clearAllocationError,
  loadAllocationData,
} from "../../store/slices/adminAllocationsSlice";
import type { RootState, AppDispatch } from "../../store/store";
import CustomButton from "../../widgets/CustomButton";

interface AllocatedMaterialsPageProps {
  onRequestReload?: () => void;
}

const AllocatedMaterialsPage: React.FC<AllocatedMaterialsPageProps> = ({
  onRequestReload,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const token = useSelector((state: RootState) => state.auth.token);
  const { projects, materials, status, error } = useSelector(
    (state: RootState) => state.adminAllocations
  );

  useEffect(() => {
    if (token) {
      dispatch(loadAllocationData(token));
    }
  }, [dispatch, token]);

  useEffect(() => {
    if (error) {
      toast.error(error);
      dispatch(clearAllocationError());
    }
  }, [dispatch, error]);

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 max-w-7xl mx-auto w-full gap-6">

      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xs font-bold text-slate-800">Allocated Materials</h1>
          <p className="text-slate-500">View and manage existing project allocations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            {/* Assuming these routes exist for navigation context */}
            <CustomButton
              variant="secondary" // Active
              size="small"
              startIcon={<FiList />}
            >
              Allocated View
            </CustomButton>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <CustomButton
              variant="text"
              onClick={() => navigate("/admin/inventory/materials")}
              startIcon={<FiGrid />}
              size="small"
            >
              Material Directory
            </CustomButton>
          </div>
          <CustomButton
            variant="primary"
            icon={<FiPlus />}
            onClick={() => navigate("/admin/inventory/allocations")} // Assuming this leads to the bulk allocator
          >
            Bulk Allocate
          </CustomButton>
        </div>
      </div>

      {status === "loading" ? (
        <div className="flex items-center justify-center p-20 bg-white rounded-xl border border-slate-200">
          <span className="text-slate-500">Loading allocations...</span>
        </div>
      ) : (
        <ProjectAllocationManager
          token={token}
          projects={projects as any}
          materials={materials as any}
          onProjectBomUpdate={onRequestReload}
          onCreateMaterial={() => navigate("/admin/inventory/materials")}
          showMultiAllocator={false}
          showAllocationTable
        />
      )}
    </div>
  );
};

export default AllocatedMaterialsPage;
