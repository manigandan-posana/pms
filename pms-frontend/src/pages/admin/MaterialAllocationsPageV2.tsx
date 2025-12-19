import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "primereact/button";

export const MaterialAllocationsPageV2: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Material Allocations</h1>
        <Button
          label="Manage Allocations"
          icon="pi pi-cog"
          className="p-button-sm"
          onClick={() => navigate("/admin/allocated-materials")}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Material Allocation Management</h3>
            <p className="text-sm text-gray-600 mb-3">
              Allocate materials to projects by defining required quantities for each material in your Bill of Materials (BOM).
            </p>
            <div className="space-y-2">
              <p className="text-sm text-gray-600">
                • Click <span className="font-semibold">"Manage Allocations"</span> above to view and manage all material allocations
              </p>
              <p className="text-sm text-gray-600">
                • Use <span className="font-semibold">Project Management</span> page to allocate materials to specific projects
              </p>
              <p className="text-sm text-gray-600">
                • Use <span className="font-semibold">Material Directory</span> page to view material details and availability
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaterialAllocationsPageV2;
