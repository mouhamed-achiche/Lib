import { useState } from "react";
import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Package, ShoppingBag, Tags, Users, Image, Zap, Home, Globe } from "lucide-react";
import logoImg from "@/img/Logo.png";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

const navItems = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/dashboard/orders", label: "Orders", icon: ShoppingBag },
  { to: "/dashboard/products", label: "Products", icon: Package },
  { to: "/dashboard/categories", label: "Categories", icon: Tags },
  { to: "/dashboard/deals", label: "Deal of Day", icon: Zap },
  { to: "/dashboard/banners", label: "Banners", icon: Image },
  { to: "/dashboard/homepage", label: "Homepage", icon: Home },
  { to: "/dashboard/users", label: "Users", icon: Users },
];

export default function AdminLayout() {
  const { currentUser, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    [
      "flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-semibold transition-colors",
      isActive
        ? "bg-academic-blue text-white"
        : "text-on-surface-variant hover:bg-muted-gray hover:text-academic-blue",
    ].join(" ");

  return (
    <div className="min-h-screen bg-muted-gray">
      <header className="border-b border-outline-variant bg-surface">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link className="flex items-center gap-3" to="/dashboard">
            <img alt="IBN SINA" className="h-14 w-14 object-contain" src={logoImg} />
            <span className="font-headline text-lg font-bold text-academic-blue">Staff</span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="relative">
              <button
                aria-label={t("selectLanguage")}
                className="flex items-center gap-1.5 rounded-full border border-outline-variant/80 bg-surface px-3 py-1.5 text-academic-blue shadow-sm transition-all duration-200 hover:border-academic-blue hover:bg-surface-container-low"
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                type="button"
              >
                <Globe className="h-4 w-4 text-academic-blue/80" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-academic-blue">
                  {language.toUpperCase()}
                </span>
              </button>
              <div className={`absolute right-0 top-full mt-2 z-50 ${langDropdownOpen ? 'block' : 'hidden'}`}>
                <div className="flex flex-col rounded-lg border border-outline-variant bg-surface shadow-lg overflow-hidden">
                  <button
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-surface-container-low ${
                      language === "fr" ? "bg-academic-blue/10 text-academic-blue" : "text-on-surface-variant"
                    }`}
                    onClick={() => {
                      setLanguage("fr");
                      setLangDropdownOpen(false);
                    }}
                    type="button"
                  >
                    Français
                  </button>
                  <button
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-surface-container-low ${
                      language === "en" ? "bg-academic-blue/10 text-academic-blue" : "text-on-surface-variant"
                    }`}
                    onClick={() => {
                      setLanguage("en");
                      setLangDropdownOpen(false);
                    }}
                    type="button"
                  >
                    English
                  </button>
                  <button
                    className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider transition-colors hover:bg-surface-container-low ${
                      language === "ar" ? "bg-academic-blue/10 text-academic-blue" : "text-on-surface-variant"
                    }`}
                    onClick={() => {
                      setLanguage("ar");
                      setLangDropdownOpen(false);
                    }}
                    type="button"
                  >
                    العربية
                  </button>
                </div>
              </div>
            </div>
            <Link
              className="text-[12px] font-semibold uppercase tracking-[0.08em] text-on-surface-variant hover:text-academic-blue"
              to="/shop"
            >
              View shop
            </Link>
            <span className="hidden text-[13px] text-on-surface-variant sm:inline">
              {currentUser?.name}
            </span>
            <button
              className="inline-flex items-center gap-2 rounded-md border border-outline-variant px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.08em] text-academic-blue"
              onClick={() => {
                logout();
                navigate("/");
              }}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 md:hidden sm:px-6">
        {navItems.map(({ to, label, end }) => (
          <NavLink
            key={to}
            className={({ isActive }) =>
              [
                "shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]",
                isActive
                  ? "bg-academic-blue text-white"
                  : "border border-outline-variant bg-surface text-on-surface-variant",
              ].join(" ")
            }
            end={end}
            to={to}
          >
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 py-6 sm:px-6">
        <aside className="hidden w-56 shrink-0 md:block">
          <nav className="sticky top-6 space-y-1 rounded-xl border border-outline-variant bg-surface p-3">
            {navItems.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} className={linkClass} end={end} to={to}>
                <Icon className="h-4 w-4" />
                {label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
