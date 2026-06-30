import { useEffect, useState } from "react";

import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar";

import Sidebar from "../components/Sidebar";

import supabase from "../supabase/supabase";

import { useNotificationBadge } from "../hooks/useNotificationBadge";

import "../styles/dashboard.css";



function ParticipantLayout() {

  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [userName, setUserName] = useState("Participant");

  const { unreadCount } = useNotificationBadge("participant");



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



      setUserName(data?.name || "Participant");

    };



    loadProfile();

  }, []);



  return (

    <div className="dashboard-layout">

      <Sidebar

        role="participant"

        isOpen={sidebarOpen}

        onClose={() => setSidebarOpen(false)}

      />



      <div className="dashboard-layout__main">

        <Navbar

          userName={userName}

          onMenuToggle={() => setSidebarOpen((open) => !open)}

          notificationsPath="/participant/notifications"

          profilePath="/participant/profile"

          unreadCount={unreadCount}

        />

        <main className="dashboard-layout__content">

          <Outlet />

        </main>

      </div>

    </div>

  );

}



export default ParticipantLayout;

