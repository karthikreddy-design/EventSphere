import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/authService";
import logo from "../assets/eventsphere-logo.png";
import Icon from "./Icon";

const adminMenuItems = [
  { label: "Dashboard", icon: "dashboard", path: "/admin-dashboard" },
  {
    label: "Events",
    icon: "events",
    children: [
      { label: "View Events", path: "/admin/events" },
      { label: "Create Event", path: "/admin/events/create" },
    ],
  },
  { label: "Participants", icon: "participants", path: "/admin/participants" },
  { label: "Scan Attendance", icon: "qrScanner", path: "/admin/scan-attendance" },
  { label: "Reports", icon: "reports", path: "/admin/reports" },
  { label: "Notifications", icon: "notifications", path: "/admin/notifications" },
  { label: "Profile", icon: "profile", path: "/admin/profile" },
];

const participantMenuItems = [
  { label: "Dashboard", icon: "dashboard", path: "/participant-dashboard" },
  { label: "Browse Events", icon: "browse", path: "/participant/browse" },
  { label: "My Events", icon: "ticket", path: "/participant/events" },
  { label: "My QR Ticket", icon: "qrScanner", path: "/participant/qr-ticket" },
  { label: "Notifications", icon: "notifications", path: "/participant/notifications" },
  { label: "Profile", icon: "profile", path: "/participant/profile" },
];

function Sidebar({ role, isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const menuItems = role === "admin" ? adminMenuItems : participantMenuItems;

  const handleLogout = async () => {
    await logoutUser();
    navigate("/");
  };

  const isEventsActive = location.pathname.startsWith("/admin/events");
  const [eventsOpen, setEventsOpen] = useState(isEventsActive);

  useEffect(() => {
    if (isEventsActive) {
      setEventsOpen(true);
    }
  }, [isEventsActive]);

  const toggleEventsMenu = () => {
    setEventsOpen((prev) => !prev);
  };

  return (
    <>
      <div
        className={`sidebar-overlay ${isOpen ? "sidebar-overlay--visible" : ""}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
        <div className="sidebar__brand">
          <div className="sidebar__logo-badge">
            <img src={logo} alt="" className="sidebar__logo-icon" aria-hidden="true" />
          </div>
          <span className="sidebar__brand-name">EventSphere</span>
        </div>

        <nav className="sidebar__nav">
          {menuItems.map((item) =>
            item.children ? (
              <div key={item.label}>
                <button
                  type="button"
                  className={`sidebar__link sidebar__link--toggle ${isEventsActive ? "sidebar__link--active" : ""}`}
                  onClick={toggleEventsMenu}
                  aria-expanded={eventsOpen}
                >
                  <span className="sidebar__icon" aria-hidden="true">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span>{item.label}</span>
                  <span className="sidebar__chevron" aria-hidden="true">
                    {eventsOpen ? "▾" : "▸"}
                  </span>
                </button>
                {eventsOpen && (
                  <div className="sidebar__submenu">
                    {item.children.map((child) => (
                      <NavLink
                        key={child.path}
                        to={child.path}
                        className={({ isActive }) =>
                          `sidebar__sublink ${isActive ? "sidebar__sublink--active" : ""}`
                        }
                        onClick={onClose}
                      >
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `sidebar__link ${isActive ? "sidebar__link--active" : ""}`
                }
                onClick={onClose}
              >
                <span className="sidebar__icon" aria-hidden="true">
                  <Icon name={item.icon} size={18} />
                </span>
                <span>{item.label}</span>
              </NavLink>
            )
          )}
        </nav>

        <button type="button" className="sidebar__logout" onClick={handleLogout}>
          <span className="sidebar__icon" aria-hidden="true">
            <Icon name="logout" size={18} />
          </span>
          <span>Logout</span>
        </button>
      </aside>
    </>
  );
}

export default Sidebar;
