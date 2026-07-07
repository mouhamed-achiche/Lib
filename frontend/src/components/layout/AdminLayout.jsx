import { NavLink, Link, Outlet, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Package, ShoppingBag, Tags, Users, Image, Zap, Home } from "lucide-react";
import logoImg from "@/img/Logo.png";
import { useAuth } from "@/lib/auth";

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
  const navigate = useNavigate();

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
