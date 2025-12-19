import React from "react";
import { NavLink, useLocation } from "react-router-dom";

interface Tab {
  label: string;
  path: string;
  icon?: string;
}

interface NavigationTabsProps {
  tabs: Tab[];
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ tabs }) => {
  const location = useLocation();

  return (
    <div className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center gap-1 px-4 overflow-x-auto">
        {tabs.map((tab) => {
          const isActive = location.pathname.startsWith(tab.path);
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-xs font-medium
                border-b-2 transition-colors whitespace-nowrap
                ${
                  isActive
                    ? "border-[#0A7326] text-[#0A7326] bg-green-50"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                }
              `}
            >
              {tab.icon && <i className={tab.icon} style={{ fontSize: "13px" }}></i>}
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default NavigationTabs;
