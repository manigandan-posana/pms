import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";

import ProjectAllocationManager from "../../components/ProjectAllocationManager";
import {
  clearAllocationError,
  loadAllocationData,
} from "../../store/slices/adminAllocationsSlice";
import type { RootState, AppDispatch } from "../../store/store";

interface MaterialAllocationsPageProps {
  onRequestReload?: () => void;
}

const MaterialAllocationsPage: React.FC<MaterialAllocationsPageProps> = ({
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
          <h1 className="text-xs font-bold text-slate-800">Allocation Manager</h1>
          <p className="text-slate-500">Assign materials to projects in bulk</p>
        </div>
      </div>

      {status === "loading" ? (
        <div className="flex items-center justify-center p-20 bg-white rounded-xl border border-slate-200">
          <span className="text-slate-500">Loading allocation data...</span>
        </div>
      ) : (
        <ProjectAllocationManager
          token={token}
          projects={projects as any}
          materials={materials as any}
          onProjectBomUpdate={onRequestReload}
          showAllocationTable={false}
          showMultiAllocator={true}
        />
      )}
    </div>
  );
};

export default MaterialAllocationsPage;
