import { HashRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { AppDataProvider } from "./context/AppDataContext";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import QuoteJourneyPage from "./pages/QuoteJourneyPage";

const navLinkClassName = ({ isActive }) =>
  [
    "rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-ink text-white shadow-glow"
      : "text-slate-600 hover:bg-white hover:text-ink",
  ].join(" ");

function Shell() {
  return (
    <div className="min-h-screen text-ink">
      <div className="pointer-events-none fixed inset-0 -z-20 bg-cloud" />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(116,217,177,0.25),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(68,178,208,0.22),_transparent_28%),linear-gradient(180deg,_#f9fdff_0%,_#f5fafb_45%,_#eef5f7_100%)]" />
      <header className="sticky top-0 z-40 border-b border-white/50 bg-white/75 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <p className="font-display text-lg font-semibold tracking-tight">
              Cover Compass
            </p>
            <p className="text-xs text-slate-500">
              Motor insurance quote journey prototype
            </p>
          </div>
          <nav className="flex items-center gap-2 rounded-full border border-mist bg-white/90 p-1 shadow-panel">
            <NavLink className={navLinkClassName} end to="/">
              Quote App
            </NavLink>
            <NavLink className={navLinkClassName} to="/admin">
              Admin Dashboard
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <Routes>
          <Route path="/" element={<QuoteJourneyPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppDataProvider>
      <HashRouter>
        <Shell />
      </HashRouter>
    </AppDataProvider>
  );
}
