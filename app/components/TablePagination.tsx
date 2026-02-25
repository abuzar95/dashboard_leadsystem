'use client'

const DEFAULT_ROWS_OPTIONS = [10, 25, 50, 100]

interface TablePaginationProps {
  totalItems: number
  page: number
  onPageChange: (page: number) => void
  rowsPerPage: number
  onRowsPerPageChange?: (rowsPerPage: number) => void
  rowsPerPageOptions?: number[]
}

export default function TablePagination({
  totalItems,
  page,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  rowsPerPageOptions = DEFAULT_ROWS_OPTIONS,
}: TablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const start = totalItems === 0 ? 0 : (page - 1) * rowsPerPage + 1
  const end = Math.min(page * rowsPerPage, totalItems)

  return (
    <div className="table-pagination">
      <div className="table-pagination-info">
        {totalItems === 0 ? (
          <span>0 items</span>
        ) : (
          <span>
            Showing {start}–{end} of {totalItems}
          </span>
        )}
      </div>
      {onRowsPerPageChange && (
        <div className="table-pagination-rows">
          <label htmlFor="rows-per-page" className="table-pagination-rows-label">
            Rows per page
          </label>
          <select
            id="rows-per-page"
            className="form-select table-pagination-select"
            value={rowsPerPage}
            onChange={(e) => {
              onRowsPerPageChange(Number(e.target.value))
              onPageChange(1)
            }}
          >
            {rowsPerPageOptions.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="table-pagination-controls">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="table-pagination-page">
          Page {page} of {totalPages}
        </span>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  )
}
