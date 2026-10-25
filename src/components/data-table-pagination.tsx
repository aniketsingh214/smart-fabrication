import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTablePaginationProps {
  ariaLabel?: string;
  totalCount?: number | null;
  currentCount: number;
  pageSize?: number;
  currentPage?: number;
  totalPages?: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  firstPageHref?: string;
  previousPageHref?: string;
  nextPageHref?: string;
  getPageHref?: (page: number) => string;
  nextPageLabel?: string;
  onFirstPage?: () => void;
  onPreviousPage?: () => void;
  onNextPage?: () => void;
  onPageChange?: (page: number) => void;
  entityName?: string;
  className?: string;
}

function getVisiblePages(current: number, total: number): (number | '...')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  if (current <= 3) {
    return [1, 2, 3, 4, 5, '...', total];
  }
  if (current >= total - 2) {
    return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
  }
  return [1, '...', current - 1, current, current + 1, '...', total];
}

export function DataTablePagination({
  ariaLabel = 'Catalog pages',
  totalCount,
  currentCount,
  pageSize = 9,
  currentPage: requestedPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  firstPageHref,
  previousPageHref,
  nextPageHref,
  getPageHref,
  nextPageLabel,
  onFirstPage,
  onPreviousPage,
  onNextPage,
  onPageChange,
  entityName = 'designs',
  className
}: DataTablePaginationProps) {
  const currentPage = requestedPage ?? 1;
  const nextLabel = nextPageLabel || (entityName === 'projects' ? 'More projects' : 'More designs');
  const computedTotalPages = totalPages ?? (totalCount != null && pageSize ? Math.max(1, Math.ceil(totalCount / pageSize)) : undefined);
  const visiblePages = computedTotalPages && computedTotalPages > 1 ? getVisiblePages(currentPage, computedTotalPages) : null;

  const startRecord = (currentPage - 1) * pageSize + 1;
  const endRecord = totalCount !== null && totalCount !== undefined ? Math.min(currentPage * pageSize, totalCount) : (currentPage - 1) * pageSize + currentCount;

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'flex flex-col md:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm',
        className
      )}
    >
      {/* Left: Summary Info */}
      <div className="flex items-center gap-2.5 text-xs text-slate-500">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
          <Layers size={15} />
        </span>
        <div>
          <span>
            Showing{' '}
            <strong className="font-semibold text-slate-900">
              {currentCount && (computedTotalPages || requestedPage) ? `${startRecord}–${endRecord}` : currentCount}
            </strong>
            {totalCount !== undefined && totalCount !== null && (
              <>
                {' '}of <strong className="font-semibold text-slate-900">{totalCount}</strong>
              </>
            )}{' '}
            {entityName}
          </span>
          {pageSize && (
            <span className="ml-2 hidden sm:inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-500">
              {pageSize} per page
            </span>
          )}
        </div>
      </div>

      {/* Right: Controls & Numbered Pages */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2">
        {onFirstPage && onPreviousPage && !visiblePages && <button type="button" title="First page" onClick={onFirstPage} disabled={!hasPreviousPage} className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"><ChevronsLeft size={14}/><span className="hidden sm:inline">First</span></button>}
        {/* Previous Page Button */}
        {previousPageHref ? (
          hasPreviousPage ? (
            <Link
              href={previousPageHref}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              title="Previous page"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Previous</span>
            </Link>
          ) : (
            <span
              className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-2.5 text-xs font-medium text-slate-300"
              aria-disabled="true"
            >
              <ChevronLeft size={14} />
              <span className="hidden sm:inline">Previous</span>
            </span>
          )
        ) : onPreviousPage ? (
          <button
            type="button"
            onClick={onPreviousPage}
            disabled={!hasPreviousPage}
            className={cn(
              'inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-semibold shadow-sm transition',
              hasPreviousPage
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
            )}
            title="Previous page"
          >
            <ChevronLeft size={14} />
            <span className="hidden sm:inline">Previous</span>
          </button>
        ) : firstPageHref && !visiblePages ? (
          hasPreviousPage ? (
            <Link
              href={firstPageHref}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              title="First page"
            >
              <ChevronsLeft size={14} />
              <span>First page</span>
            </Link>
          ) : (
            <span
              className="inline-flex h-8 cursor-not-allowed items-center gap-1 rounded-lg border border-slate-100 bg-slate-50 px-3 text-xs font-medium text-slate-300"
              aria-disabled="true"
            >
              <ChevronsLeft size={14} />
              <span>First page</span>
            </span>
          )
        ) : onFirstPage && !visiblePages ? (
          <button
            type="button"
            onClick={onFirstPage}
            disabled={!hasPreviousPage}
            className={cn(
              'inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-semibold shadow-sm transition',
              hasPreviousPage
                ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
            )}
            title="First page"
          >
            <ChevronsLeft size={14} />
            <span>First page</span>
          </button>
        ) : null}

        {/* Numbered Page Buttons: 1 to 5, etc. */}
        {visiblePages ? (
          <div className="flex items-center gap-1">
            {visiblePages.map((p, idx) => {
              if (p === '...') {
                return (
                  <span
                    key={`ellipsis-${idx}`}
                    className="inline-flex h-8 w-6 items-center justify-center text-xs font-bold text-slate-400"
                  >
                    …
                  </span>
                );
              }

              const isCurrent = p === currentPage;
              if (isCurrent) {
                return (
                  <span
                    key={p}
                    aria-current="page"
                    className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg bg-orange-600 px-2.5 text-xs font-bold text-white shadow-sm"
                  >
                    {p}
                  </span>
                );
              }

              if (getPageHref) {
                return (
                  <Link
                    key={p}
                    href={getPageHref(p)}
                    className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                  >
                    {p}
                  </Link>
                );
              }

              if (onPageChange) {
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => onPageChange(p)}
                    className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-orange-300 hover:bg-orange-50 hover:text-orange-600"
                  >
                    {p}
                  </button>
                );
              }

              return (
                <span
                  key={p}
                  className="inline-flex h-8 min-w-[32px] items-center justify-center rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700"
                >
                  {p}
                </span>
              );
            })}
          </div>
        ) : (
          /* Simple Mode Pill for Cursor / Infinite pagination */
          <span className="inline-flex h-8 items-center rounded-lg border border-orange-200 bg-orange-50/70 px-3 text-xs font-bold text-orange-700">
            {requestedPage ? `Page ${currentPage}` : hasPreviousPage ? 'Page 2+' : 'Page 1'}
          </span>
        )}

        {/* Next / More Designs Button */}
        {nextPageHref ? (
          hasNextPage ? (
            <Link
              href={nextPageHref}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-3 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
              title="Next page"
            >
              <span>Next</span>
              <span className="hidden xl:inline text-slate-300 text-[11px]">/ {nextLabel}</span>
              <ChevronRight size={14} />
            </Link>
          ) : (
            <span
              className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 text-xs font-medium text-slate-300"
              aria-disabled="true"
            >
              <span>Next</span>
              <ChevronRight size={14} />
            </span>
          )
        ) : onNextPage ? (
          <button
            type="button"
            onClick={onNextPage}
            disabled={!hasNextPage}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold shadow-sm transition',
              hasNextPage
                ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
            )}
            title="Next page"
          >
            <span>Next</span>
            <ChevronRight size={14} />
          </button>
        ) : null}
      </div>
    </nav>
  );
}
