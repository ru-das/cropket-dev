// All routes (SPEC.md §3.1). Real farmer/buyer/fpo pages arrive in 0.5-0.7
// and replace PlaceholderPage one at a time. No loaders - server data comes
// from TanStack Query in services/*, not from the router (SPEC.md §3.2).
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppShell from "@/components/shell/AppShell";
import WelcomePage from "@/routes/welcome/WelcomePage";
import PlaceholderPage from "@/routes/PlaceholderPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route element={<AppShell />}>
          <Route path="/farmer" element={<PlaceholderPage titleKey="nav.home" />} />
          <Route path="/farmer/lots" element={<PlaceholderPage titleKey="nav.lots" />} />
          <Route path="/farmer/khata" element={<PlaceholderPage titleKey="nav.khata" />} />
          <Route path="/farmer/me" element={<PlaceholderPage titleKey="nav.me" />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
