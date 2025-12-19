import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FiPackage, FiTruck, FiRepeat, FiShoppingCart } from "react-icons/fi";

const InventoryNavigationTabs: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { label: "BOM", path: "/workspace/inventory/bom", icon: FiPackage },
    { label: "Inwards", path: "/workspace/inventory/inwards", icon: FiPackage },
    { label: "Outwards", path: "/workspace/inventory/outwards", icon: FiTruck },
    { label: "Transfers", path: "/workspace/inventory/transfers", icon: FiRepeat },
    { label: "Procurement", path: "/workspace/inventory/procurement", icon: FiShoppingCart },
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div className="border-b border-slate-200 mb-6">
      <div className="flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = isActive(tab.path);
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors
                ${active
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                }
              `}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default InventoryNavigationTabs;
