import React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function SearchBar({
  value,
  onChange,
  onClear,
  placeholder = "Search records, vaccines, or family members...",
  className,
}) {
  return (
    <div className={cn("relative flex items-center w-full max-w-sm", className)}>
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-8 h-9 text-xs sm:text-sm bg-card"
      />
      {value && (
        <button
          onClick={onClear || (() => onChange(''))}
          className="absolute right-2.5 p-1 rounded-sm text-muted-foreground hover:text-foreground"
          aria-label="Clear search"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default SearchBar;
