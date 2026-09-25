import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Dynamically calculate human-readable age from date of birth (YYYY-MM-DD).
 * Age changes over time so it is computed dynamically rather than stored.
 */
export function calculateAge(dobString) {
  if (!dobString) return { formatted: 'Unknown', years: 0, months: 0, days: 0 };

  const birthDate = new Date(dobString);
  if (isNaN(birthDate.getTime())) {
    return { formatted: 'Invalid date', years: 0, months: 0, days: 0 };
  }

  const today = new Date();
  if (birthDate > today) {
    return { formatted: 'Future date', years: 0, months: 0, days: 0 };
  }

  let years = today.getFullYear() - birthDate.getFullYear();
  let months = today.getMonth() - birthDate.getMonth();
  let days = today.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    // Days in previous month
    const prevMonthLastDay = new Date(today.getFullYear(), today.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  let formatted = '';
  if (years === 0 && months === 0) {
    formatted = `${days} day${days === 1 ? '' : 's'}`;
  } else if (years === 0) {
    formatted = `${months} mo${months === 1 ? '' : 's'}${days > 0 ? ` ${days}d` : ''}`;
  } else if (years < 3) {
    formatted = `${years} yr${years === 1 ? '' : 's'}${months > 0 ? ` ${months} mo${months === 1 ? '' : 's'}` : ''}`;
  } else {
    formatted = `${years} years`;
  }

  return { formatted, years, months, days };
}

/**
 * Format ISO date string to readable format e.g. "Oct 14, 2021"
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return dateString;
  }
}
