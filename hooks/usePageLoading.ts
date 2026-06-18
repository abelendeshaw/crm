"use client";

import { useEffect, useState } from "react";

export function usePageLoading(delayMs = 500) {
  const [isPageLoading, setIsPageLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsPageLoading(false), delayMs);
    return () => clearTimeout(timer);
  }, [delayMs]);

  return isPageLoading;
}
