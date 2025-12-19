import React, { useState } from "react";
import { Paginator } from "primereact/paginator";
import type { PaginatorPageChangeEvent, PaginatorCurrentPageReportOptions, PaginatorRowsPerPageDropdownOptions, PaginatorPageLinksOptions, PaginatorPrevPageLinkOptions, PaginatorNextPageLinkOptions, PaginatorFirstPageLinkOptions, PaginatorLastPageLinkOptions } from "primereact/paginator";
import { Dropdown } from "primereact/dropdown";
import { InputText } from "primereact/inputtext";
import { Ripple } from "primereact/ripple";
import { Tooltip } from "primereact/tooltip";
import { classNames } from "primereact/utils";

export interface CustomPaginatorProps {
  first: number;
  rows: number;
  totalRecords: number;
  onPageChange: (e: PaginatorPageChangeEvent) => void;
  rowsPerPageOptions?: number[];
  showGoToPage?: boolean;
  className?: string;
}

/**
 * Custom paginator template with attractive styling
 * Follows PrimeReact Paginator template patterns
 */
const CustomPaginator: React.FC<CustomPaginatorProps> = ({
  first,
  rows,
  totalRecords,
  onPageChange,
  rowsPerPageOptions = [10, 20, 50],
  showGoToPage = false,
  className = "",
}) => {
  const [currentPageInput, setCurrentPageInput] = useState("");
  const [pageInputTooltip, setPageInputTooltip] = useState("Press Enter to go to page");

  const handlePageInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    options: PaginatorCurrentPageReportOptions
  ) => {
    if (event.key === "Enter") {
      const page = parseInt(currentPageInput, 10);
      if (isNaN(page) || page < 1 || page > options.totalPages) {
        setPageInputTooltip(`Enter a value between 1 and ${options.totalPages}`);
      } else {
        const newFirst = rows * (page - 1);
        onPageChange({
          first: newFirst,
          rows,
          page: page - 1,
          pageCount: options.totalPages,
        });
        setCurrentPageInput("");
        setPageInputTooltip("Press Enter to go to page");
      }
    }
  };

  const template = {
    layout: showGoToPage
      ? "FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport"
      : "FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown",

    FirstPageLink: (options: PaginatorFirstPageLinkOptions) => (
      <button
        type="button"
        className={classNames(
          "custom-paginator-btn custom-paginator-nav",
          { "custom-paginator-disabled": options.disabled }
        )}
        onClick={options.onClick}
        disabled={options.disabled}
        title="First Page"
      >
        <i className="pi pi-angle-double-left" />
        <Ripple />
      </button>
    ),

    LastPageLink: (options: PaginatorLastPageLinkOptions) => (
      <button
        type="button"
        className={classNames(
          "custom-paginator-btn custom-paginator-nav",
          { "custom-paginator-disabled": options.disabled }
        )}
        onClick={options.onClick}
        disabled={options.disabled}
        title="Last Page"
      >
        <i className="pi pi-angle-double-right" />
        <Ripple />
      </button>
    ),

    PrevPageLink: (options: PaginatorPrevPageLinkOptions) => (
      <button
        type="button"
        className={classNames(
          "custom-paginator-btn custom-paginator-nav",
          { "custom-paginator-disabled": options.disabled }
        )}
        onClick={options.onClick}
        disabled={options.disabled}
        title="Previous"
      >
        <i className="pi pi-angle-left" />
        <Ripple />
      </button>
    ),

    NextPageLink: (options: PaginatorNextPageLinkOptions) => (
      <button
        type="button"
        className={classNames(
          "custom-paginator-btn custom-paginator-nav",
          { "custom-paginator-disabled": options.disabled }
        )}
        onClick={options.onClick}
        disabled={options.disabled}
        title="Next"
      >
        <i className="pi pi-angle-right" />
        <Ripple />
      </button>
    ),

    PageLinks: (options: PaginatorPageLinksOptions) => {
      // Show ellipsis for non-visible pages
      if (
        (options.view.startPage === options.page && options.view.startPage !== 0) ||
        (options.view.endPage === options.page && options.page + 1 !== options.totalPages)
      ) {
        return (
          <span className="custom-paginator-ellipsis">...</span>
        );
      }

      return (
        <button
          type="button"
          className={classNames("custom-paginator-btn custom-paginator-page", {
            "custom-paginator-page-active": options.page === options.currentPage,
          })}
          onClick={options.onClick}
        >
          {options.page + 1}
          <Ripple />
        </button>
      );
    },

    RowsPerPageDropdown: (options: PaginatorRowsPerPageDropdownOptions) => {
      const dropdownOptions = rowsPerPageOptions.map((value) => ({
        label: String(value),
        value,
      }));

      return (
        <div className="custom-paginator-rows-dropdown">
          <span className="custom-paginator-rows-label">Rows:</span>
          <Dropdown
            value={options.value}
            options={dropdownOptions}
            onChange={options.onChange}
            className="custom-paginator-dropdown"
          />
        </div>
      );
    },

    CurrentPageReport: (options: PaginatorCurrentPageReportOptions) => {
      if (!showGoToPage) {
        return (
          <span className="custom-paginator-report">
            {options.first} - {options.last} of {options.totalRecords}
          </span>
        );
      }

      return (
        <div className="custom-paginator-goto">
          <Tooltip target=".goto-input" content={pageInputTooltip} position="top" />
          <span className="custom-paginator-report">
            Page {options.currentPage} of {options.totalPages}
          </span>
          <span className="custom-paginator-goto-label">Go to:</span>
          <InputText
            className="goto-input custom-paginator-input"
            value={currentPageInput}
            onChange={(e) => setCurrentPageInput(e.target.value)}
            onKeyDown={(e) => handlePageInputKeyDown(e, options)}
            size={1}
          />
        </div>
      );
    },
  };

  if (totalRecords <= rows) {
    return null; // Don't render paginator if all records fit on one page
  }

  return (
    <Paginator
      template={template}
      first={first}
      rows={rows}
      totalRecords={totalRecords}
      onPageChange={onPageChange}
      className={classNames("custom-paginator", className)}
    />
  );
};

export default CustomPaginator;

/**
 * Paginator template object to use with DataTable's paginatorTemplate prop
 * This provides consistent styling across all DataTables
 */
export const paginatorTemplate = {
  layout: "FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink RowsPerPageDropdown CurrentPageReport",

  FirstPageLink: (options: PaginatorFirstPageLinkOptions) => (
    <button
      type="button"
      className={classNames(
        "custom-paginator-btn custom-paginator-nav",
        { "custom-paginator-disabled": options.disabled }
      )}
      onClick={options.onClick}
      disabled={options.disabled}
      title="First Page"
    >
      <i className="pi pi-angle-double-left" />
      <Ripple />
    </button>
  ),

  LastPageLink: (options: PaginatorLastPageLinkOptions) => (
    <button
      type="button"
      className={classNames(
        "custom-paginator-btn custom-paginator-nav",
        { "custom-paginator-disabled": options.disabled }
      )}
      onClick={options.onClick}
      disabled={options.disabled}
      title="Last Page"
    >
      <i className="pi pi-angle-double-right" />
      <Ripple />
    </button>
  ),

  PrevPageLink: (options: PaginatorPrevPageLinkOptions) => (
    <button
      type="button"
      className={classNames(
        "custom-paginator-btn custom-paginator-nav",
        { "custom-paginator-disabled": options.disabled }
      )}
      onClick={options.onClick}
      disabled={options.disabled}
      title="Previous"
    >
      <i className="pi pi-angle-left" />
      <Ripple />
    </button>
  ),

  NextPageLink: (options: PaginatorNextPageLinkOptions) => (
    <button
      type="button"
      className={classNames(
        "custom-paginator-btn custom-paginator-nav",
        { "custom-paginator-disabled": options.disabled }
      )}
      onClick={options.onClick}
      disabled={options.disabled}
      title="Next"
    >
      <i className="pi pi-angle-right" />
      <Ripple />
    </button>
  ),

  PageLinks: (options: PaginatorPageLinksOptions) => {
    if (
      (options.view.startPage === options.page && options.view.startPage !== 0) ||
      (options.view.endPage === options.page && options.page + 1 !== options.totalPages)
    ) {
      return (
        <span className="custom-paginator-ellipsis">...</span>
      );
    }

    return (
      <button
        type="button"
        className={classNames("custom-paginator-btn custom-paginator-page", {
          "custom-paginator-page-active": options.page === options.currentPage,
        })}
        onClick={options.onClick}
      >
        {options.page + 1}
        <Ripple />
      </button>
    );
  },

  RowsPerPageDropdown: (options: PaginatorRowsPerPageDropdownOptions) => {
    const dropdownOptions = [
      { label: "10", value: 10 },
      { label: "20", value: 20 },
      { label: "50", value: 50 },
    ];

    return (
      <div className="custom-paginator-rows-dropdown">
        <span className="custom-paginator-rows-label">Rows:</span>
        <Dropdown
          value={options.value}
          options={dropdownOptions}
          onChange={options.onChange}
          className="custom-paginator-dropdown"
        />
      </div>
    );
  },

  CurrentPageReport: (options: PaginatorCurrentPageReportOptions) => (
    <span className="custom-paginator-report">
      {options.first} - {options.last} of {options.totalRecords}
    </span>
  ),
};
