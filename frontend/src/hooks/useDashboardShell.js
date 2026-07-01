import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function useDashboardShell(sidebarOpen, setSidebarOpen) {
  const { pathname } = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname, setSidebarOpen]);

  useEffect(() => {
    if (!sidebarOpen) {
      document.body.style.removeProperty("overflow");
      return undefined;
    }

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.removeProperty("overflow");
    };
  }, [sidebarOpen]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setSidebarOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setSidebarOpen]);
}
