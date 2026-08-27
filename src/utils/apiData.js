export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function firstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

export function extractItems(data, ...fallbacks) {
  return firstArray(
    data?.items,
    data?.data?.items,
    data?.data,
    ...fallbacks,
    data
  );
}

export function extractPagination(data, responsePagination = null) {
  const source = responsePagination || data?.pagination || data?.meta || data || {};
  const page = Number(source.page ?? data?.page ?? 1);
  const limit = Number(source.limit ?? data?.limit ?? 0);
  const total = Number(source.total ?? data?.total ?? 0);
  const totalPages = Number(source.total_pages ?? source.totalPages ?? data?.total_pages ?? data?.totalPages ?? 1);

  return {
    page: Number.isFinite(page) && page > 0 ? page : 1,
    limit: Number.isFinite(limit) && limit > 0 ? limit : null,
    total: Number.isFinite(total) && total >= 0 ? total : 0,
    total_pages: Number.isFinite(totalPages) && totalPages >= 1 ? totalPages : 1,
  };
}

export function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function valueOrDash(value) {
  return value === undefined || value === null || value === '' ? '-' : value;
}
