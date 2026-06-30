import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import supabase from "../supabase/supabase";

function ParticipantRoute() {
  const [loading, setLoading] = useState(true);
  const [isParticipant, setIsParticipant] = useState(false);

  useEffect(() => {
    const checkRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsParticipant(false);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      setIsParticipant(data?.role !== "admin");
      setLoading(false);
    };

    checkRole();
  }, []);

  if (loading) {
    return null;
  }

  if (!isParticipant) {
    return <Navigate to="/admin-dashboard" replace />;
  }

  return <Outlet />;
}

export default ParticipantRoute;
