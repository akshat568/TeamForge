/**
 * Utility helpers for TeamForge client
 */

/**
 * Truncate a string to a max length, appending ellipsis
 */
export const truncate = (str, maxLength = 100) => {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength) + "..." : str;
};

/**
 * Format a date to a readable string
 */
export const formatDate = (date) => {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
};

/**
 * Generate initials from a full name
 */
export const getInitials = (name = "") => {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
};

/**
 * Debounce utility
 */
export const debounce = (fn, delay = 300) => {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
};
