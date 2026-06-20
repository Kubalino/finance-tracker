import { useState } from 'react';

export function useFilters() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1); // null = "Full Year"

  const setFullYear = () => setMonth(null);

  return { year, setYear, month, setMonth, setFullYear };
}
