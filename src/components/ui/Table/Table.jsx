"use client"

import { forwardRef, useState, useMemo } from "react"
import styles from "./Table.module.css"

export const Table = forwardRef(function Table(
  {
    columns = [],
    data = [],
    keyField = "id",
    sortable = false,
    stickyHeader = false,
    className = "",
    emptyMessage = "Nenhum dado disponível",
    renderRow,
    // Optional row selection: pass both to make rows clickable/selectable
    selectedKey = null,
    onSelectRow,
    ...props
  },
  ref
) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" })

  const handleSort = key => {
    if (!sortable) return
    const column = columns.find(c => c.key === key)
    if (!column?.sortable) return

    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc"
    }))
  }

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data

    return [...data].sort((a, b) => {
      const aVal = a[sortConfig.key]
      const bVal = b[sortConfig.key]
      if (aVal === bVal) return 0

      const direction = sortConfig.direction === "asc" ? 1 : -1
      return aVal < bVal ? -direction : direction
    })
  }, [data, sortConfig])

  if (sortedData.length === 0) {
    return (
      <div className={styles.empty} role="status">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div ref={ref} className={`${styles.wrapper} ${className}`} {...props}>
      <div className={`${styles.tableContainer} ${stickyHeader ? styles.stickyHeader : ""}`}>
        <table className={styles.table} role={onSelectRow ? "grid" : undefined}>
          <thead className={styles.thead}>
            <tr>
              {columns.map(column => (
                <th
                  key={column.key}
                  className={`${styles.th} ${column.sortable ? styles.sortable : ""}`}
                  style={{ width: column.width }}
                  onClick={() => handleSort(column.key)}
                >
                  <div className={styles.thContent}>
                    {column.header}
                    {column.sortable && (
                      <span
                        className={`${styles.sortIcon} ${sortConfig.key === column.key ? styles[sortConfig.direction] : ""}`}
                      >
                        {sortConfig.key === column.key
                          ? sortConfig.direction === "asc"
                            ? "▲"
                            : "▼"
                          : "⇅"}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className={styles.tbody}>
            {sortedData.map((row, rowIndex) => {
              const isSelected = onSelectRow && row[keyField] === selectedKey
              const selectionProps = onSelectRow
                ? {
                    tabIndex: 0,
                    "aria-selected": isSelected,
                    onClick: () => onSelectRow(isSelected ? null : row),
                    onKeyDown: event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        onSelectRow(isSelected ? null : row)
                      }
                    }
                  }
                : {}
              return (
                <tr
                  key={row[keyField]}
                  className={`${styles.tr} ${rowIndex % 2 === 0 ? styles.even : styles.odd} ${onSelectRow ? styles.selectable : ""} ${isSelected ? styles.selected : ""}`}
                  {...selectionProps}
                >
                  {columns.map(column => (
                    <td key={column.key} className={styles.td}>
                      {column.render ? column.render(row[column.key], row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
})

Table.displayName = "Table"
