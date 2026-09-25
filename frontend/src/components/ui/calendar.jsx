import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function Calendar({
  className,
  selectedDate,
  onSelectDate,
  events = [],
  initialMonth = new Date(2026, 9, 1), // Default to Oct 2026
}) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  // Days calculations
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  
  // Starting day index (0: Sun, 1: Mon, etc.) - adjusted for Monday start
  let startDay = firstDayOfMonth.getDay() - 1;
  if (startDay === -1) startDay = 6;

  const daysInMonth = lastDayOfMonth.getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    const today = new Date(2026, 9, 24);
    setCurrentMonth(new Date(today.getFullYear(), today.getMonth(), 1));
    if (onSelectDate) onSelectDate(today);
  };

  // Build calendar matrix
  const calendarCells = [];

  // Previous month padding days
  for (let i = startDay - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const dateObj = new Date(year, month - 1, dayNum);
    calendarCells.push({
      date: dateObj,
      dayNumber: dayNum,
      isCurrentMonth: false,
      dateString: dateObj.toISOString().split('T')[0],
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateObj = new Date(year, month, d);
    calendarCells.push({
      date: dateObj,
      dayNumber: d,
      isCurrentMonth: true,
      dateString: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    });
  }

  // Next month padding days to complete 35 or 42 grid cells
  const remainingCells = 35 - calendarCells.length;
  const paddingNext = remainingCells > 0 ? remainingCells : (42 - calendarCells.length);
  for (let n = 1; n <= Math.max(0, paddingNext); n++) {
    const dateObj = new Date(year, month + 1, n);
    calendarCells.push({
      date: dateObj,
      dayNumber: n,
      isCurrentMonth: false,
      dateString: dateObj.toISOString().split('T')[0],
    });
  }

  // Map events to date strings
  const eventsByDate = {};
  events.forEach((ev) => {
    const key = ev.scheduledDate || ev.date;
    if (key) {
      if (!eventsByDate[key]) eventsByDate[key] = [];
      eventsByDate[key].push(ev);
    }
  });

  const selectedStr = selectedDate instanceof Date 
    ? selectedDate.toISOString().split('T')[0] 
    : (selectedDate || '');

  return (
    <div className={cn("p-4 rounded-2xl border border-border/80 bg-card select-none", className)}>
      {/* Month Navigation Header */}
      <div className="flex items-center justify-between gap-2 pb-4 border-b border-border/60">
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" />
          <h3 className="font-bold text-base text-foreground font-sans">
            {monthNames[month]} {year}
          </h3>
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleToday}
            className="text-xs h-7 px-2 font-medium"
          >
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrevMonth}
            className="h-7 w-7 p-0"
            aria-label="Previous Month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleNextMonth}
            className="h-7 w-7 p-0"
            aria-label="Next Month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Weekday Row */}
      <div className="grid grid-cols-7 gap-1 pt-3 pb-2 text-center">
        {daysOfWeek.map((day) => (
          <div key={day} className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Day Cells Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((cell, idx) => {
          const dayEvents = eventsByDate[cell.dateString] || [];
          const isSelected = selectedStr === cell.dateString;
          const isToday = cell.dateString === '2026-10-24';

          const hasOverdue = dayEvents.some((e) => e.status === 'OVERDUE');
          const hasDue = dayEvents.some((e) => e.status === 'DUE');
          const hasUpcoming = dayEvents.some((e) => e.status === 'UPCOMING');
          const hasCompleted = dayEvents.some((e) => e.status === 'COMPLETED');

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate && onSelectDate(cell.date, dayEvents)}
              className={cn(
                "relative flex flex-col items-center justify-start h-11 sm:h-12 p-1 rounded-xl text-xs transition-all cursor-pointer group",
                cell.isCurrentMonth
                  ? "text-foreground hover:bg-muted/60"
                  : "text-muted-foreground/40 hover:bg-muted/20",
                isSelected && "bg-primary text-primary-foreground font-bold hover:bg-primary",
                isToday && !isSelected && "ring-1 ring-primary/60 font-semibold"
              )}
            >
              <span className={cn("text-xs leading-none mt-1", isSelected && "text-primary-foreground")}>
                {cell.dayNumber}
              </span>

              {/* Event indicators */}
              {dayEvents.length > 0 && (
                <div className="flex items-center gap-0.5 mt-auto mb-1">
                  {hasOverdue && (
                    <span className="h-1.5 w-1.5 rounded-full bg-status-overdue" title="Overdue vaccination" />
                  )}
                  {hasDue && (
                    <span className="h-1.5 w-1.5 rounded-full bg-status-due" title="Due vaccination" />
                  )}
                  {hasUpcoming && !hasOverdue && !hasDue && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" title="Upcoming vaccination" />
                  )}
                  {hasCompleted && !hasOverdue && !hasDue && !hasUpcoming && (
                    <span className="h-1.5 w-1.5 rounded-full bg-status-completed" title="Completed vaccination" />
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-2 border-t border-border/50 text-[11px] text-muted-foreground">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-status-overdue" />
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-status-due" />
            <span>Due Soon</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span>Scheduled</span>
          </div>
        </div>
        <span className="font-mono text-[10px]">Click a date to filter events</span>
      </div>
    </div>
  );
}

export default Calendar;
