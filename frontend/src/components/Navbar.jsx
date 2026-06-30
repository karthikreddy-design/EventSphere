import { Link } from "react-router-dom";

import Icon from "./Icon";



function Navbar({ userName, onMenuToggle, notificationsPath, profilePath, unreadCount = 0 }) {

  return (

    <header className="navbar">

      <div className="navbar__left">

        <button

          type="button"

          className="navbar__menu-btn"

          onClick={onMenuToggle}

          aria-label="Toggle sidebar"

        >

          <Icon name="menu" size={22} />

        </button>

        <p className="navbar__welcome">Welcome Back, {userName}</p>

      </div>



      <div className="navbar__right">

        <Link to={notificationsPath} className="navbar__icon-btn">

          <Icon name="notifications" size={18} />

          <span>Notifications</span>

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


