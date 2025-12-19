import React, { useEffect } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { FiGrid, FiList } from "react-icons/fi";

import ProjectAllocationManager from "../../components/ProjectAllocationManager";
import {
  clearAllocationError,
  loadAllocationData,
} from "../../store/slices/adminAllocationsSlice";
import type { RootState, AppDispatch } from "../../store/store";
import CustomButton from "../../widgets/CustomButton";

interface MaterialAllocationsPageProps {
  onRequestReload?: () => void;
}

const MaterialAllocationsPage: React.FC<MaterialAllocationsPageProps> = ({
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
          <h1 className="text-2xl font-bold text-slate-800">Allocation Manager</h1>
          <p className="text-slate-500">Assign materials to projects in bulk</p>
        </div>
        <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
          <CustomButton
            variant={isActive("/admin/allocated") ? "secondary" : "text"}
            onClick={() => navigate("/admin/allocated")}
            startIcon={<FiList />}
            size="small"
          >
            Allocated View
          </CustomButton>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
          <CustomButton
            variant={isActive("/admin/materials") ? "secondary" : "text"}
            onClick={() => navigate("/admin/materials")}
            startIcon={<FiGrid />}
            size="small"
          >
            Material Directory
          </CustomButton>
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
          onCreateMaterial={() => navigate("/admin/materials")}
          showAllocationTable={false}
          showMultiAllocator={true}
        />
      )}
    </div>
  );
};

export default MaterialAllocationsPage;
