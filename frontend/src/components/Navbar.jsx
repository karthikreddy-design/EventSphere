import { Link } from "react-router-dom";
import Icon from "./Icon";

function Navbar({
  userName,
  onMenuToggle,
  sidebarOpen = false,
  notificationsPath,
  profilePath,
  unreadCount = 0,
}) {
  return (
    <header className="navbar">
      <div className="navbar__left">
        <button
          type="button"
          className="navbar__menu-btn"
          onClick={onMenuToggle}
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarOpen}
          aria-controls="dashboard-sidebar"
        >
          <Icon name="menu" size={22} />
        </button>
        <p className="navbar__welcome">
          <span className="navbar__welcome-label">Welcome back,</span>
          <span className="navbar__welcome-name">{userName}</span>
        </p>
      </div>

      <div className="navbar__right">
        <Link
          to={notificationsPath}
          className="navbar__icon-btn"
          aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        >
          <Icon name="notifications" size={18} />
          {unreadCount > 0 && (
            <span className="navbar__badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </Link>

        <Link to={profilePath} className="navbar__profile" aria-label="Profile">
          <span className="navbar__avatar">
            <Icon name="profile" size={18} />
          </span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;
