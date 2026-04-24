import { HashRouter, Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { AppDataProvider } from "./context/AppDataContext";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import QuoteJourneyPage from "./pages/QuoteJourneyPage";

function Shell() {
  const location = useLocation();
  const isAdminRoute = location.pathname === "/admin";

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
              {isAdminRoute
                ? "Internal operations view"
                : "Car insurance renewal and comparison"}
            </p>
          </div>
          {isAdminRoute ? (
            <Link
              className="rounded-full border border-mist bg-white px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand-300 hover:bg-brand-50"
              to="/"
            >
              Back to quote journey
            </Link>
          ) : null}
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
