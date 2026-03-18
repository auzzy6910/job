import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  Home, Users, RotateCw, Star, ListChecks, Rocket,
  Crown, Gift, Diamond, LogOut, Menu, X, Wallet
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/dashboard", label: "Dashboard", icon: Home },
  { path: "/referrals", label: "Referrals", icon: Users },
  { path: "/spin", label: "Spin Wheel", icon: RotateCw },
  { path: "/stars", label: "Stars", icon: Star },
  { path: "/microtasks", label: "Microtasks", icon: ListChecks },
  { path: "/booster", label: "Booster", icon: Rocket },
  { path: "/leaderboard", label: "Leaderboard", icon: Crown },
  { path: "/gifts", label: "Gifts", icon: Gift },
  { path: "/diamond", label: "Diamond Draw", icon: Diamond },
  { path: "/wallet", label: "Wallet", icon: Wallet },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Top Bar */}
      <header className="bg-black/30 backdrop-blur-md border-b border-purple-500/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-white">
              {menuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/dashboard" className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-purple-400 bg-clip-text text-transparent">
              ReferralHub
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 bg-purple-500/20 rounded-full px-4 py-1.5">
              <Wallet size={16} className="text-yellow-400" />
              <span className="text-yellow-400 font-semibold">
                KES {user?.balance?.toFixed(2) || "0.00"}
              </span>
            </div>
            <span className="text-purple-300 text-sm hidden sm:block">
              {user?.username}
            </span>
            <button onClick={handleLogout} className="text-gray-400 hover:text-white transition">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`${menuOpen ? "block" : "hidden"} md:block fixed md:sticky top-16 md:top-0 left-0 z-40 w-64 bg-black/40 backdrop-blur-md md:bg-transparent border-r border-purple-500/10 min-h-[calc(100vh-4rem)] md:min-h-screen overflow-y-auto`}>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    isActive
                      ? "bg-purple-500/30 text-white shadow-lg shadow-purple-500/10"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon size={20} className={isActive ? "text-yellow-400" : ""} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main */}
        <main className="flex-1 p-4 md:p-6 max-w-5xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Mobile overlay */}
      {menuOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setMenuOpen(false)} />
      )}
    </div>
  );
}
