"use client"

import { useState } from "react"
import styles from "./Table.module.css"

export function Table({
  columns = [],
  data = [],
  keyField = "id",
  sortable = false,
  onSort,
  sortBy,
  sortOrder = "asc",
  emptyMessage = "No data available",
  className = "",
  responsive = false,
  stickyHeader = false,
  rowKey,
  onRowClick,
  ...props
}) {
  const [internalSortBy, setInternalSortBy] = useState(sortBy)
  const [internalSortOrder, setInternalSortOrder] = useState(sortOrder)

  const currentSortBy = sortBy !== undefined ? sortBy : internalSortBy
  const currentSortOrder = sortOrder !== undefined ? sortOrder : internalSortOrder

  const handleSort = columnKey => {
    if (!sortable) return

    let newSortOrder = "asc"
    if (currentSortBy === columnKey && currentSortOrder === "asc") {
      newSortOrder = "desc"
    }

    setInternalSortBy(columnKey)
    setInternalSortOrder(newSortOrder)
    onSort?.(columnKey, newSortOrder)
  }

  const sortedData = [...data].sort((a, b) => {
    if (!currentSortBy) return 0

    const aValue = a[currentSortBy]
    const bValue = b[currentSortBy]

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    return currentSortOrder === "asc" ? comparison : -comparison
  })

  const getRowKey = (row, index) => {
    if (rowKey) return typeof rowKey === "function" ? rowKey(row) : row[rowKey]
    return row[keyField] || index
  }

  return (
    <div
      className={`${styles.wrapper} ${responsive ? styles.responsiveCard : ""} ${stickyHeader ? styles.stickyHeader : ""} ${className}`}
      {...props}
    >
      {data.length === 0 ? (
        <div className={styles.tdEmpty}>{emptyMessage}</div>
      ) : (
        <table className={styles.table} role="grid">
          <thead className={styles.thead}>
            <tr role="row">
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`${styles.th} ${column.sortable ? styles.sortable : ""} ${currentSortBy === column.key ? (currentSortOrder === "asc" ? styles.sortAsc : styles.sortDesc) : ""}`}
                  scope="col"
                  onClick={() => column.sortable && handleSort(column.key)}
                  style={{ width: column.width }}
                >
                  {column.header}
                  {column.sortable && (
                    <span className={styles.sortIcon} aria-hidden="true">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="18 15 12 9 6 15" />
                      </svg>
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {sortedData.map((row, rowIndex) => (
              <tr
                key={getRowKey(row, rowIndex)}
                className={styles.tr}
                role="row"
                onClick={() => onRowClick?.(row)}
                style={{ cursor: onRowClick ? "pointer" : "default" }}
                tabIndex={onRowClick ? 0 : undefined}
                onKeyDown={e => {
                  if (onRowClick && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault()
                    onRowClick(row)
                  }
                }}
              >
                {columns.map(column => (
                  <td
                    key={column.key}
                    className={styles.td}
                    data-label={column.header}
                    style={{ width: column.width }}
                  >
                    {column.render ? column.render(row[column.key], row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function TableColumn({ key, header, width, sortable = false, render }) {
  return null // This is just a type definition component
}
