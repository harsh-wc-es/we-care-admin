export default function Pagination({ page, totalPages, onPageChange, loading = false }) {
  const safePage = Number.isFinite(Number(page)) && Number(page) > 0 ? Number(page) : 1;
  const safeTotalPages = Number.isFinite(Number(totalPages)) && Number(totalPages) > 0 ? Number(totalPages) : 1;

  if (safeTotalPages <= 1) return null;

  const goToPage = (nextPage) => {
    if (loading || typeof onPageChange !== 'function') return;
    const clampedPage = Math.min(Math.max(nextPage, 1), safeTotalPages);
    if (clampedPage !== safePage) onPageChange(clampedPage);
  };

  return (
    <div className="admin-pagination">
      <button
        className="btn btn-outline"
        disabled={safePage === 1 || loading}
        onClick={() => goToPage(safePage - 1)}
      >
        Previous
      </button>
      <span className="admin-pagination__meta">
        Page <strong>{safePage}</strong> of <strong>{safeTotalPages}</strong>
      </span>
      <button
        className="btn btn-outline"
        disabled={safePage === safeTotalPages || loading}
        onClick={() => goToPage(safePage + 1)}
      >
        Next
      </button>
    </div>
  );
}
