import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import API from "../services/api";
import { getTicketUpdates, getUnreadTicketUpdates } from "../utils/ticketUpdates";

const icons = {
  dashboard: (
    <path d="M4 4h6v6H4V4Zm10 0h6v4h-6V4ZM4 14h6v6H4v-6Zm10-2h6v8h-6v-8Z" />
  ),
  account: (
    <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H5Z" />
  ),
  about: (
    <path d="M11 10h2v7h-2v-7Zm0-4h2v2h-2V6Zm1-4a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z" />
  ),
  assets: (
    <path d="M4 5h16v10H4V5Zm6 12h4v2h4v2H6v-2h4v-2Z" />
  ),
  tickets: (
    <path d="M5 5h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4V5Zm5 3h6v2h-6V8Zm0 4h5v2h-5v-2Z" />
  ),
  inventory: (
    <path d="M4 7 12 3l8 4-8 4-8-4Zm0 3 8 4 8-4v7l-8 4-8-4v-7Z" />
  ),
  repairs: (
    <path d="m14.7 6.3 3-3 3 3-3 3-3-3ZM3 17.6l7.8-7.8 3.4 3.4L6.4 21H3v-3.4Z" />
  ),
  users: (
    <path d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 21a7 7 0 0 1 14 0H2Zm14.5-1a8.8 8.8 0 0 0-2.1-4.9A5.5 5.5 0 0 1 22 20h-5.5Z" />
  ),
  menu: (
    <path d="M4 7h16v2H4V7Zm0 4h16v2H4v-2Zm0 4h16v2H4v-2Z" />
  ),
  close: (
    <path d="m6.4 5 12.6 12.6-1.4 1.4L5 6.4 6.4 5Zm11.2 0L19 6.4 6.4 19 5 17.6 17.6 5Z" />
  ),
  bell: (
    <path d="M12 22a2.7 2.7 0 0 0 2.7-2.5H9.3A2.7 2.7 0 0 0 12 22Zm-7-5h14l-1.4-2.3V10a5.6 5.6 0 0 0-4.1-5.4V3a1.5 1.5 0 0 0-3 0v1.6A5.6 5.6 0 0 0 6.4 10v4.7L5 17Z" />
  ),
  logout: (
    <path d="M4 4h8v2H6v12h6v2H4V4Zm11.6 4.4L20.2 13l-4.6 4.6-1.4-1.4 2.2-2.2H9v-2h7.4l-2.2-2.2 1.4-1.4Z" />
  ),
};

function Icon({ name, className = "" }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem("user"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [latestUpdate, setLatestUpdate] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  useEffect(() => {
    const fetchNotifications = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setNotificationCount(0);
        setLatestUpdate(null);
        return;
      }

      try {
        const response = await API.get("/tickets/mine", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const tickets = response.data.tickets || [];
        const unreadUpdates = getUnreadTicketUpdates(tickets);

        setNotificationCount(unreadUpdates.length);
        setLatestUpdate(getTicketUpdates(tickets)[0] || null);
      } catch {
        setNotificationCount(0);
        setLatestUpdate(null);
      }
    };

    fetchNotifications();

    const intervalId = window.setInterval(fetchNotifications, 30000);
    window.addEventListener("ticket-notifications-updated", fetchNotifications);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("ticket-notifications-updated", fetchNotifications);
    };
  }, [user?.id]);

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: "dashboard" },
    { path: "/account", label: "My Account", icon: "account", badge: notificationCount },
    { path: "/about", label: "About", icon: "about" },
    { path: "/assets", label: "Assets", icon: "assets" },
    { path: "/tickets", label: "Hardware Requests", icon: "tickets" },
    { path: "/inventory", label: "Inventory", icon: "inventory" },
    { path: "/repairs", label: "Repairs", icon: "repairs" },
  ];

  if (user?.role === "admin" || user?.role === "system_admin" || user?.role === "head_of_it") {
    navItems.push({ path: "/users", label: "User Management", icon: "users" });
  }

  return (
    <div className="app-shell">
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="sidebar-scrim"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`app-sidebar ${sidebarOpen ? "app-sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">GS</div>
          <div className="min-w-0">
            <h1>GSMB Helpdesk</h1>
            <p>Hardware operations</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="icon-button ml-auto lg:hidden"
            aria-label="Close navigation"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`nav-link ${isActive(item.path) ? "nav-link-active" : ""}`}
            >
              <span className="nav-icon">
                <Icon name={item.icon} className="h-4 w-4" />
              </span>
              <span>{item.label}</span>
              {item.badge > 0 && (
                <span className="nav-badge">
                  {item.badge > 99 ? "99+" : item.badge}
                </span>
              )}
            </Link>
          ))}
        </nav>

        <div className="sidebar-status-card">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100/70">Live queue</p>
          <div className="mt-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-black leading-none text-white">{notificationCount}</p>
              <p className="mt-1 text-xs font-semibold text-blue-100/70">unread update(s)</p>
            </div>
            <div className="progress-ring">
              <span>{notificationCount > 0 ? "!" : "OK"}</span>
            </div>
          </div>
        </div>
      </aside>

      <div className="app-workspace">
        <header className="app-topbar">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen((open) => !open)}
              className="icon-button lg:hidden"
              aria-label="Toggle navigation"
            >
              <Icon name="menu" className="h-5 w-5" />
            </button>

            <div className="topbar-title">
              <p>Government IT portal</p>
              <h2>Service Management Workspace</h2>
            </div>
          </div>

          <div className="topbar-actions">
            <Link
              to="/account"
              title={latestUpdate ? `${latestUpdate.ticketId}: ${latestUpdate.comment || "Request updated"}` : "My Account"}
              className={`icon-button relative ${isActive("/account") ? "is-active" : ""}`}
              aria-label="Request notifications"
            >
              <Icon name="bell" className="h-5 w-5" />
              {notificationCount > 0 && (
                <span className="notification-dot">
                  {notificationCount > 9 ? "9+" : notificationCount}
                </span>
              )}
            </Link>

            <div className="user-pill">
              <span className="avatar-dot">{getInitials(user?.name)}</span>
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-black text-slate-900">{user?.name || "User"}</span>
                <span className="block truncate text-xs font-semibold capitalize text-slate-500">
                  {(user?.role || "team").replace(/_/g, " ")}
                </span>
              </span>
            </div>

            <button type="button" onClick={handleLogout} className="icon-button" aria-label="Logout">
              <Icon name="logout" className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <div className="content-wrap">{children}</div>
        </main>
      </div>
    </div>
  );
}

function getInitials(name = "User") {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default Layout;
