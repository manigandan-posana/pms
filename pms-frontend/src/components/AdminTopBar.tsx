import type { FC } from "react";
import { FaBell, FaUserCircle } from "react-icons/fa";
import ProjectSelector from "./ProjectSelector";

interface AdminTopBarProps {
  userName?: string | null;
  userRole?: string | null;
  pageHeading?: string;
  showProjectSelector?: boolean;
}

const AdminTopBar: FC<AdminTopBarProps> = ({ 
  userName, 
  userRole, 
  pageHeading = "Inventory",
  showProjectSelector = false 
}) => {
  const initials = (userName || "")
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="w-full bg-gradient-to-r from-white to-slate-50 shadow-sm">
      <div className="w-full mx-auto flex items-center justify-between gap-4 px-4 py-2">
        {/* Left: Page heading */}
        <div className="flex items-center gap-3">
          <div className="text-lg font-semibold text-slate-900">{pageHeading}</div>
        </div>

        {/* Right: Project selector + notifications + user */}
        <div className="flex items-center gap-3">
          {showProjectSelector && <ProjectSelector />}
          <button
            type="button"
            aria-label="Notifications"
            className="relative p-2 rounded-md hover:bg-slate-100"
          >
            <FaBell className="text-slate-600" />
          </button>

          <div className="hidden sm:flex sm:flex-col sm:items-end">
            <div className="text-[13px] font-medium text-slate-900">{userName || "—"}</div>
            <div className="text-[11px] text-slate-500">{userRole || "—"}</div>
          </div>

          <div className="h-8 w-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center text-[13px] font-semibold text-[var(--primary)]">
            {initials ? (
              initials
            ) : (
              <FaUserCircle className="text-[18px] text-[var(--primary)]" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTopBar;
