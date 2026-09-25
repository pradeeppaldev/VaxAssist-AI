import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import SearchBar from './SearchBar';

export function FilterBar({
  options = [],
  selectedOption,
  onSelectOption,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  actions,
  className,
}) {
  return (
    <div
      className={cn(
        "flex flex-col md:flex-row md:items-center justify-between gap-3 p-2 rounded-xl bg-muted/40 border border-border/60",
        className
      )}
    >
      <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto py-0.5">
        {options.map((opt) => {
          const isSelected = selectedOption === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onSelectOption(opt.value)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap",
                isSelected
                  ? "bg-primary text-primary-foreground shadow-2xs"
                  : "bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background border border-border/50"
              )}
            >
              {opt.label}
              {opt.count !== undefined && (
                <span className={cn(
                  "ml-1.5 px-1.5 py-0.2 rounded-full text-[10px]",
                  isSelected ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {opt.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        {onSearchChange !== undefined && (
          <SearchBar
            value={searchValue || ''}
            onChange={onSearchChange}
            placeholder={searchPlaceholder}
            className="w-full md:w-60"
          />
        )}
        {actions}
      </div>
    </div>
  );
}

export default FilterBar;
