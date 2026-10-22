import React from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ChevronsLeft, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DataTablePaginationProps {
  ariaLabel?: string;
  totalCount?: number | null;
  currentCount: number;
  pageSize?: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  firstPageHref?: string;
  nextPageHref?: string;
  nextPageLabel?: string;
  onFirstPage?: () => void;
  onNextPage?: () => void;
  entityName?: string;
  className?: string;
}

export function DataTablePagination({
  ariaLabel = 'Catalog pages',
  totalCount,
  currentCount,
  pageSize = 48,
  hasPreviousPage,
  hasNextPage,
  firstPageHref,
  nextPageHref,
  nextPageLabel,
  onFirstPage,
  onNextPage,
  entityName = 'designs',
  className
}: DataTablePaginationProps) {
  const nextLabel = nextPageLabel || (entityName === 'projects' ? 'More projects' : 'More designs');

  return (
    <nav
      aria-label={ariaLabel}
      className={cn(
        'flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm',
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
            Showing <strong className="font-semibold text-slate-900">{currentCount}</strong>
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

      {/* Right: Controls Buttons */}
      <div className="flex items-center gap-2">
        {/* First Page Button */}
        {firstPageHref ? (
          hasPreviousPage ? (
            <Link
              href={firstPageHref}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
              title="Go to first page"
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
        ) : onFirstPage ? (
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
            title="Go to first page"
          >
            <ChevronsLeft size={14} />
            <span>First page</span>
          </button>
        ) : null}

        {/* Current Page Pill */}
        <span className="inline-flex h-8 items-center rounded-lg border border-orange-200 bg-orange-50/70 px-3 text-xs font-bold text-orange-700">
          {hasPreviousPage ? 'Page 2+' : 'Page 1'}
        </span>

        {/* Next / More Designs Button */}
        {nextPageHref ? (
          hasNextPage ? (
            <Link
              href={nextPageHref}
              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-900 bg-slate-900 px-3.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800"
            >
              <span>{nextLabel}</span>
              <ChevronRight size={14} />
            </Link>
          ) : (
            <span
              className="inline-flex h-8 cursor-not-allowed items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3.5 text-xs font-medium text-slate-300"
              aria-disabled="true"
            >
              <span>{nextLabel}</span>
              <ChevronRight size={14} />
            </span>
          )
        ) : onNextPage ? (
          <button
            type="button"
            onClick={onNextPage}
            disabled={!hasNextPage}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-3.5 text-xs font-semibold shadow-sm transition',
              hasNextPage
                ? 'border-slate-900 bg-slate-900 text-white hover:bg-slate-800'
                : 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-300'
            )}
          >
            <span>{nextLabel}</span>
            <ChevronRight size={14} />
          </button>
        ) : null}
      </div>
    </nav>
  );
}
