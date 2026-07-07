import { useEffect, useState } from "react";
import { NavLink, Link, useNavigate, useLocation } from "react-router-dom";
import { Gauge, LogOut, Menu, ShoppingCart, User, UserPlus, X, Globe } from "lucide-react";
import logoImg from "@/img/Logo.png";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";

export function Header() {
  const { count } = useCart();
  const { currentUser, isStaff, isCustomer, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    [
      "relative font-heading font-semibold text-[13px] tracking-[0.08em] uppercase transition-all duration-300 py-2 px-1",
      "after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:scale-x-0 after:bg-oxford-red after:transition-transform after:duration-300 hover:after:scale-x-100",
      isActive ? "text-academic-blue after:scale-x-100 font-bold" : "text-on-surface-variant/80 hover:text-oxford-red",
    ].join(" ");

  const navLinks = [
    { to: "/", labelKey: "home" },
    { to: "/catalog", labelKey: "categories" },
  ];

  return (
    <header
      className={`fixed top-0 z-50 w-full transition-all duration-300 ${
        scrolled 
          ? "border-b border-outline-variant bg-surface/90 shadow-md backdrop-blur-lg py-1" 
          : "border-b border-outline-variant/60 bg-surface/98 backdrop-blur-md py-3"
      }`}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4">
            <button
              aria-label="Menu"
              className="rounded-lg p-2.5 text-primary transition-all duration-200 hover:bg-surface-container-high hover:scale-105 active:scale-95 md:hidden"
              onClick={() => setMenuOpen((open) => !open)}
              type="button"
            >
              {menuOpen ? <X className="h-5.5 w-5.5" /> : <Menu className="h-5.5 w-5.5" />}
            </button>
            <Link className="group flex shrink-0 items-center" to="/">
              <img
                alt="IBN SINA Logo"
                className="h-14 w-14 object-contain transition-all duration-500 group-hover:rotate-3 group-hover:scale-108 md:h-18 md:w-18"
                src={logoImg}
              />
            </Link>
          </div>

          {/* Vertical Divider */}
          <div className="hidden h-6 w-px bg-outline-variant/60 md:block" />

          {/* Navigation Links grouped next to logo */}
          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.to} className={linkClass} to={link.to}>
                {t(link.labelKey)}
              </NavLink>
            ))}
          </nav>
        </div>

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

          {/* Cart Icon Container */}
          <Link
            aria-label="Cart"
            className="group relative flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/60 bg-surface transition-all duration-300 hover:border-oxford-red hover:bg-oxford-red/5 hover:scale-105 active:scale-95"
            to="/cart"
          >
            <ShoppingCart className="h-5 w-5 text-on-surface-variant transition-colors group-hover:text-oxford-red" />
            {count > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-oxford-red text-[10px] font-bold text-white shadow-md transition-transform duration-300 group-hover:scale-110">
                {count}
              </span>
            )}
          </Link>

          {/* User Actions */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              {isCustomer && (
                <div className="hidden items-center gap-2 md:flex">
                </div>
              )}
              {isStaff && (
                <Link
                  className="relative hidden items-center gap-1.5 rounded-lg border border-oxford-red/20 bg-oxford-red/5 px-3.5 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-oxford-red transition-all duration-300 hover:bg-oxford-red hover:text-white md:inline-flex"
                  to="/dashboard"
                >
                  <Gauge className="h-4 w-4" />
                  <span>{t("dashboard")}</span>
                  <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-oxford-red" />
                </Link>
              )}
              <button
                className="hidden items-center gap-1.5 rounded-lg border border-outline-variant/60 bg-surface px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high hover:text-error md:flex"
                onClick={() => {
                  logout();
                  if (
                    location.pathname === "/track-order" ||
                    location.pathname.startsWith("/dashboard")
                  ) {
                    navigate("/");
                  }
                }}
                type="button"
              >
                <LogOut className="h-4 w-4" />
                <span>{t("logout")}</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-on-surface-variant transition-all duration-200 hover:bg-surface-container-high hover:text-academic-blue md:flex"
                to="/login"
              >
                <User className="h-4 w-4" />
                <span>{t("login")}</span>
              </Link>
              <Link
                className="hidden items-center gap-1.5 rounded-lg bg-academic-blue px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-white shadow-sm transition-all duration-300 hover:bg-primary hover:shadow-md md:flex"
                to="/register"
              >
                <UserPlus className="h-4 w-4" />
                <span>{t("register")}</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {menuOpen && (
        <nav className="border-b border-outline-variant bg-surface/98 px-4 py-4 backdrop-blur-md md:hidden">
          <div className="space-y-2">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                className="block py-2.5 text-[14px] font-semibold uppercase tracking-[0.06em] text-academic-blue transition-colors hover:text-oxford-red"
                onClick={() => setMenuOpen(false)}
                to={link.to}
              >
                {t(link.labelKey)}
              </NavLink>
            ))}
            <Link className="block py-2.5 text-[14px] font-semibold uppercase text-academic-blue transition-colors hover:text-oxford-red" onClick={() => setMenuOpen(false)} to="/cart">
              {t("cart")} ({count})
            </Link>
            {currentUser ? (
              <>
                {isCustomer && (
                  <>
                  </>
                )}
                {isStaff && (
                  <Link className="block py-2.5 text-[14px] font-semibold text-oxford-red transition-colors hover:text-oxford-red/80" onClick={() => setMenuOpen(false)} to="/dashboard">
                    {t("dashboard")}
                  </Link>
                )}
                <button
                  className="block w-full py-2.5 text-left text-[14px] font-semibold text-error transition-colors hover:text-error/80"
                  onClick={() => {
                    logout();
                    setMenuOpen(false);
                    navigate("/");
                  }}
                  type="button"
                >
                  {t("logout")}
                </button>
              </>
            ) : (
              <>
                <Link className="block py-2.5 text-[14px] font-semibold text-academic-blue transition-colors hover:text-oxford-red" onClick={() => setMenuOpen(false)} to="/login">
                  {t("login")}
                </Link>
                <Link className="block py-2.5 text-[14px] font-semibold text-academic-blue transition-colors hover:text-oxford-red" onClick={() => setMenuOpen(false)} to="/register">
                  {t("register")}
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
}
