import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import API from "../services/api";
import { getTicketUpdates, getUnreadTicketUpdates } from "../utils/ticketUpdates";
import { hasRole, IT_INVENTORY_ROLES, NETWORK_MONITORING_VIEW_ROLES } from "../utils/roles";
import { useTranslation } from "../i18n/LanguageContext";
import LanguageSwitcher from "../i18n/LanguageSwitcher";
import { Button, IconButton } from "../design-system";
import Breadcrumbs from "./Breadcrumbs";
import "./shell.css";
import { useAuth } from "../auth/AuthContext";

const iconPaths = {
  dashboard:"M4 4h6v6H4V4Zm10 0h6v4h-6V4ZM4 14h6v6H4v-6Zm10-2h6v8h-6v-8Z", requests:"M5 5h14v4a2 2 0 0 0 0 4v4H5v-4a2 2 0 0 0 0-4V5Zm4 3h7v2H9V8Zm0 4h6v2H9v-2Z", repairs:"m14.7 6.3 3-3 3 3-3 3-3-3ZM3 17.6l7.8-7.8 3.4 3.4L6.4 21H3v-3.4Z", assets:"M4 5h16v10H4V5Zm6 12h4v2h4v2H6v-2h4v-2Z", custody:"M7 3h10v3H7V3Zm-2 5h14v13H5V8Zm3 3v2h8v-2H8Zm0 4v2h5v-2H8Z", inventory:"M4 7 12 3l8 4-8 4-8-4Zm0 3 8 4 8-4v7l-8 4-8-4v-7Z", network:"M4 5h16v10H4V5Zm2 2v6h12V7H6Zm5 10h2v2h3v2H8v-2h3v-2Z", users:"M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm10 1a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2 21a7 7 0 0 1 14 0H2Z", report:"M5 3h14v18H5V3Zm3 4v2h8V7H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z", settings:"M10.8 2h2.4l.5 2.1 1.8.8 1.9-1.1 1.7 1.7L18 7.4l.8 1.8 2.2.6v2.4l-2.2.6-.8 1.8 1.1 1.9-1.7 1.7-1.9-1.1-1.8.8-.5 2.1h-2.4l-.5-2.1-1.8-.8-1.9 1.1-1.7-1.7L6 14.6l-.8-1.8-2.2-.6V9.8l2.2-.6L6 7.4 4.9 5.5l1.7-1.7 1.9 1.1 1.8-.8.5-2.1ZM12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z", about:"M11 10h2v7h-2v-7Zm0-4h2v2h-2V6Zm1-4a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z", account:"M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0H5Z", bell:"M12 22a2.7 2.7 0 0 0 2.7-2.5H9.3A2.7 2.7 0 0 0 12 22Zm-7-5h14l-1.4-2.3V10a5.6 5.6 0 0 0-4.1-5.4V3h-3v1.6A5.6 5.6 0 0 0 6.4 10v4.7L5 17Z", menu:"M4 6h16v2H4V6Zm0 5h16v2H4v-2Zm0 5h16v2H4v-2Z", collapse:"m14.6 6-6 6 6 6 1.4-1.4-4.6-4.6L16 7.4 14.6 6Z", logout:"M4 4h8v2H6v12h6v2H4V4Zm11.6 4.4L20.2 13l-4.6 4.6-1.4-1.4 2.2-2.2H9v-2h7.4l-2.2-2.2 1.4-1.4Z",
};
function Icon({ name }) { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d={iconPaths[name]} /></svg>; }

function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { enumLabel, formatDateTime, t } = useTranslation();
  const { user, clearSession } = useAuth();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem("sidebarCollapsed") === "true");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [latestUpdate, setLatestUpdate] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const profileRef = useRef(null);

  const adminRoles = ["admin", "system_admin", "head_of_it"];
  const navGroups = [
    { title:t("layout.navGroup.overview"), items:[{ path:"/dashboard", label:t("layout.nav.dashboard"), icon:"dashboard" }] },
    { title:t('ui.serviceManagement'), items:[{ path:"/tickets", label:t("layout.nav.tickets"), icon:"requests" },{ path:"/repairs", label:t("layout.nav.repairs"), icon:"repairs" }] },
    { title:t('ui.assetManagement'), items:[{ path:"/assets", label:t("layout.nav.assets"), icon:"assets" },...(hasRole(user,adminRoles)?[{ path:"/asset-issues", label:t("assetIssues.records"), icon:"custody" }]:[]),...(hasRole(user,IT_INVENTORY_ROLES)?[{ path:"/inventory", label:t("layout.nav.inventory"), icon:"inventory" }]:[])] },
    { title:t('ui.infrastructure'), items:hasRole(user,NETWORK_MONITORING_VIEW_ROLES)?[{ path:"/network", label:t("common.networkMonitoring"), icon:"network" }]:[] },
    { title:t('ui.administration'), items:hasRole(user,adminRoles)?[{ path:"/users", label:t("layout.nav.users"), icon:"users" },{ path:"/reports", label:t('breadcrumbs.reports'), icon:"report" },{ path:"/settings", label:t('breadcrumbs.settings'), icon:"settings" }]:[] },
    { title:t('ui.information'), items:[{ path:"/about", label:t("layout.nav.about"), icon:"about" }] },
    { title:t('ui.account'), items:[{ path:"/account", label:t("layout.nav.account"), icon:"account", badge:notificationCount },{ label:t("layout.logout"), icon:"logout", action:"logout" }] },
  ].filter((group) => group.items.length);

  const handleLogout = () => { clearSession(); navigate("/login"); };
  const toggleCollapsed = () => setCollapsed((value) => { localStorage.setItem("sidebarCollapsed", String(!value)); return !value; });

  useEffect(() => {
    const closeProfile = (event) => { if (!profileRef.current?.contains(event.target)) setProfileOpen(false); };
    document.addEventListener("mousedown", closeProfile); return () => document.removeEventListener("mousedown", closeProfile);
  }, []);
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user) return;
      try { const response = await API.get("/tickets/mine"); const tickets=response.data.tickets||[]; const updates=getTicketUpdates(tickets); setNotificationCount(getUnreadTicketUpdates(tickets).length); setLatestUpdate(updates[0]||null); setLastUpdated(new Date()); } catch { setNotificationCount(0); }
    };
    fetchNotifications(); const intervalId=window.setInterval(fetchNotifications,30000); window.addEventListener("ticket-notifications-updated",fetchNotifications);
    return()=>{window.clearInterval(intervalId);window.removeEventListener("ticket-notifications-updated",fetchNotifications);};
  }, [user]);

  return <div className={`enterprise-shell ${collapsed?"sidebar-collapsed":""}`}>
    {mobileOpen && <button type="button" className="enterprise-scrim" aria-label={t('layout.closeNavigation')} onClick={()=>setMobileOpen(false)} />}
    <aside id="primary-navigation" className={`enterprise-sidebar ${collapsed?"is-collapsed":""} ${mobileOpen?"is-mobile-open":""}`} aria-label="Primary navigation">
      <div className="enterprise-brand"><img src="/GSMB LOGO New One-01.jpg.jpeg" alt="GSMB Logo" className="enterprise-brand-logo" /><div className="enterprise-brand-copy"><strong>GSMB</strong><span>{t('common.workspace')}</span></div></div>
      <button type="button" className="enterprise-sidebar-toggle" onClick={toggleCollapsed} aria-label={collapsed?t('ui.expandSidebar'):t('ui.collapseSidebar')} aria-expanded={!collapsed}><Icon name="collapse" /></button>
    <div className="enterprise-sidebar-scroll"><nav>{navGroups.map((group)=><section className="enterprise-nav-group" key={group.title}><h2 className="enterprise-nav-group-title">{group.title.toUpperCase()}</h2>{group.items.map((item)=>item.planned?<button type="button" disabled className="enterprise-nav-disabled" key={item.label}><span className="enterprise-nav-icon"><Icon name={item.icon}/></span><span className="enterprise-nav-label">{item.label}</span><span className="enterprise-nav-planned">{t('layout.planned')}</span></button>:item.action==="logout"?<button type="button" className="enterprise-nav-link" onClick={handleLogout} key={item.label}><span className="enterprise-nav-icon"><Icon name={item.icon}/></span><span className="enterprise-nav-label">{item.label}</span></button>:<NavLink to={item.path} key={item.path} onClick={()=>setMobileOpen(false)} className={({isActive})=>`enterprise-nav-link ${isActive?"is-active":""}`} title={collapsed?item.label:undefined}><span className="enterprise-nav-icon"><Icon name={item.icon}/></span><span className="enterprise-nav-label">{item.label}</span>{item.badge>0&&<span className="nav-badge">{item.badge>99?"99+":item.badge}</span>}</NavLink>)}</section>)}</nav></div>
    </aside>
    <div className="enterprise-main">
      <header className="enterprise-header"><div className="enterprise-header-left"><IconButton className="enterprise-mobile-toggle" label={t('layout.toggleNavigation')} onClick={()=>setMobileOpen(true)}><Icon name="menu"/></IconButton><Breadcrumbs pathname={location.pathname}/></div><div className="enterprise-header-actions">{lastUpdated&&<span className="enterprise-updated">{t('ui.lastUpdated')} {formatDateTime(lastUpdated,{hour:"2-digit",minute:"2-digit"})}</span>}<LanguageSwitcher/><Link to="/account" className="enterprise-notification gov-icon-button" aria-label={`${notificationCount} ${t('layout.unreadUpdates')}`} title={latestUpdate?.comment||t('ui.notifications')}><Icon name="bell"/>{notificationCount>0&&<span className="enterprise-notification-dot">{notificationCount>9?"9+":notificationCount}</span>}</Link><div className="enterprise-profile" ref={profileRef}><button type="button" className="enterprise-profile-trigger" onClick={()=>setProfileOpen((value)=>!value)} aria-haspopup="menu" aria-expanded={profileOpen}><span className="enterprise-avatar">{getInitials(user?.name || t('common.user'))}</span><span className="enterprise-profile-copy"><strong>{user?.name||t("common.user")}</strong><span>{enumLabel("roles",user?.role||"team")}</span></span><span aria-hidden="true">⌄</span></button>{profileOpen&&<div className="enterprise-profile-menu" role="menu"><Link to="/account" role="menuitem" onClick={()=>setProfileOpen(false)}>{t('ui.myAccount')}</Link><Button variant="ghost" role="menuitem" onClick={handleLogout}>{t('ui.signOut')}</Button></div>}</div></div></header>
      <main className="enterprise-content" id="main-content">{children}</main>
    </div>
  </div>;
}

function getInitials(name="User"){return name.split(" ").map((part)=>part[0]).join("").slice(0,2).toUpperCase();}
export default Layout;
