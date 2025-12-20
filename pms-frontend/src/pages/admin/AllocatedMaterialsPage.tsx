
import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import ProjectAllocationManager from "../../components/ProjectAllocationManager";
import {
  clearAllocationError,
  loadAllocationData,
} from "../../store/slices/adminAllocationsSlice";
import type { RootState, AppDispatch } from "../../store/store";
import CustomLoader from "../../widgets/CustomLoader";

interface AllocatedMaterialsPageProps {
  onRequestReload?: () => void;
}

const AllocatedMaterialsPage: React.FC<AllocatedMaterialsPageProps> = ({
  onRequestReload,
}) => {
  const dispatch = useDispatch<AppDispatch>();

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

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 max-w-7xl mx-auto w-full gap-6">

      {/* Navigation Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xs font-bold text-slate-800">Allocated Materials</h1>
          <p className="text-slate-500">View and manage existing project allocations</p>
        </div>
      </div>

      {status === "loading" ? (
        <CustomLoader message="Loading allocations..." />
      ) : (
        <ProjectAllocationManager
          token={token}
          projects={projects as any}
          materials={materials as any}
          onProjectBomUpdate={onRequestReload}
          showMultiAllocator={false}
          showAllocationTable
        />
      )}
    </div>
  );
};

export default AllocatedMaterialsPage;
