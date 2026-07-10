import { useState, useMemo } from "react";

export function usePagination<T>(items: T[], pageSize: number = 20) {
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const paginatedItems = useMemo(() => {
    const start = page * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  const safePage = Math.min(page, totalPages - 1);
  if (safePage !== page) {
    setPage(safePage);
  }

  return {
    page: Math.min(page, totalPages - 1),
    totalPages,
    paginatedItems,
    setPage,
    nextPage: () => setPage(p => Math.min(p + 1, totalPages - 1)),
    prevPage: () => setPage(p => Math.max(p - 1, 0)),
    hasNext: page < totalPages - 1,
    hasPrev: page > 0,
  };
}
