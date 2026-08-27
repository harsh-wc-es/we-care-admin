import { useState, useCallback } from 'react';

/**
 * Reusable pagination hook.
 * Manages page state, computes totalPages from API response,
 * and resets page to 1 when filters/search change.
 *
 * @param {number} limit - items per page (default 20)
 * @returns {{ page, limit, totalPages, setPage, setTotalFromResponse, resetPage }}
 */
export default function usePagination(limit = 20) {
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  /**
   * Extract pagination metadata from API response data.
   * Handles: { total_pages, totalPages, total, pagination: { total_pages } }
   */
  const setTotalFromResponse = useCallback((resData) => {
    if (!resData || typeof resData !== 'object') { setTotalPages(1); return; }
    const meta = resData.pagination || resData.meta || resData.data?.pagination || resData.data?.meta || resData || {};
    const tp =
      resData.total_pages ??
      resData.totalPages ??
      resData.last_page ??
      meta.total_pages ??
      meta.totalPages ??
      meta.last_page ??
      (resData.total != null ? Math.ceil(resData.total / limit) : null) ??
      (meta.total != null ? Math.ceil(meta.total / limit) : null);
    const nextTotal = Number(tp);
    setTotalPages(Number.isFinite(nextTotal) && nextTotal >= 1 ? Math.ceil(nextTotal) : 1);
  }, [limit]);

  const resetPage = useCallback(() => setPage(1), []);

  return { page, limit, totalPages, setPage, setTotalFromResponse, resetPage };
}
