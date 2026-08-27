import EmptyState from './EmptyState';
import LoadingSkeleton from './LoadingSkeleton';

export default function DataTable({
  columns,
  rows,
  loading,
  skeletonRows = 5,
  emptyState,
  errorState,
  rowKey = 'id',
  renderMobileCard,
}) {
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeRows = Array.isArray(rows) ? rows : [];
  const labelledColumns = safeColumns.filter((column) => column.label);
  const actionColumns = safeColumns.filter((column) => !column.label);

  const renderDefaultMobileCard = (row) => (
    <div className="mobile-data-card__fields">
      {labelledColumns.map((column) => (
        <div className="mobile-data-card__field" key={column.key}>
          <span>{column.label}</span>
          <strong>{column.render ? column.render(row) : (row?.[column.key] ?? '-')}</strong>
        </div>
      ))}
      {actionColumns.map((column) => (
        <div className="mobile-data-card__actions" key={column.key}>
          {column.render ? column.render(row) : row?.[column.key]}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              {safeColumns.map((column) => (
                <th key={column.key}>{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && Array.from({ length: skeletonRows }).map((_, rowIndex) => (
              <tr key={`skeleton-${rowIndex}`}>
                {safeColumns.map((column) => (
                  <td key={column.key}>
                    <LoadingSkeleton />
                  </td>
                ))}
              </tr>
            ))}

            {!loading && errorState && (
              <tr>
                <td colSpan={safeColumns.length || 1}>{errorState}</td>
              </tr>
            )}

            {!loading && !errorState && safeRows.length === 0 && (
              <tr>
                <td colSpan={safeColumns.length || 1}>{emptyState || <EmptyState title="No records found" />}</td>
              </tr>
            )}

            {!loading && !errorState && safeRows.map((row, rowIndex) => (
              <tr key={row?.[rowKey] ?? rowIndex}>
                {safeColumns.map((column) => (
                  <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mobile-data-list">
        {loading && Array.from({ length: Math.min(skeletonRows, 3) }).map((_, rowIndex) => (
          <div className="mobile-data-card" key={`mobile-skeleton-${rowIndex}`}>
            <LoadingSkeleton style={{ height: 18, width: '60%', marginBottom: 12 }} />
            <LoadingSkeleton style={{ height: 14, width: '100%', marginBottom: 8 }} />
            <LoadingSkeleton style={{ height: 14, width: '80%' }} />
          </div>
        ))}

        {!loading && errorState && <div className="mobile-data-card">{errorState}</div>}

        {!loading && !errorState && safeRows.length === 0 && (
          <div className="mobile-data-card mobile-data-card--empty">
            {emptyState || <EmptyState title="No records found" />}
          </div>
        )}

        {!loading && !errorState && safeRows.map((row, rowIndex) => (
          <div className="mobile-data-card" key={row?.[rowKey] ?? rowIndex}>
            {renderMobileCard ? renderMobileCard(row, rowIndex) : renderDefaultMobileCard(row)}
          </div>
        ))}
      </div>
    </>
  );
}
