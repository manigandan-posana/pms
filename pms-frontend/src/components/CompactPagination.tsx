import React from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface CompactPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
}

export const CompactPagination: React.FC<CompactPaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
}) => {
  const handlePrevious = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  return (
    <div className="flex items-center justify-between gap-1 bg-slate-50 px-1 py-0.5 rounded text-[9px] border border-slate-200">
      <span className="text-slate-600">
        {currentPage} / {totalPages}
        {totalItems > 0 && ` (${totalItems})`}
      </span>
      <div className="flex items-center gap-0.5">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          title="Previous page"
        >
          <FiChevronLeft size={12} />
        </button>
        <button
          onClick={handleNext}
          disabled={currentPage >= totalPages}
          className="inline-flex h-5 w-5 items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          title="Next page"
        >
          <FiChevronRight size={12} />
        </button>
      </div>
    </div>
  );
};

export default CompactPagination;
