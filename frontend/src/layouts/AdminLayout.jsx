import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import supabase from "../supabase/supabase";
import { useNotificationBadge } from "../hooks/useNotificationBadge";
import { useDashboardShell } from "../hooks/useDashboardShell";
import "../styles/dashboard.css";

function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState("Admin");
  const { unreadCount } = useNotificationBadge("admin");

  useDashboardShell(sidebarOpen, setSidebarOpen);

  useEffect(() => {
    const loadProfile = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("name")
        .eq("id", user.id)
        .single();

      setUserName(data?.name || "Admin");
    };

    loadProfile();
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar
        role="admin"
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="dashboard-layout__main">
        <Navbar
          userName={userName}
          sidebarOpen={sidebarOpen}
          onMenuToggle={() => setSidebarOpen((open) => !open)}
          notificationsPath="/admin/notifications"
          profilePath="/admin/profile"
          unreadCount={unreadCount}
        />
        <main className="dashboard-layout__content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
