// All routes (SPEC.md §3.1). RequireAuth checks the session; RequireRole
// checks profile + role (see guards.tsx for why they're split that way).
import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import AppShell from "@/components/shell/AppShell";
import { RequireAuth, RequireRole } from "./guards";
import WelcomePage from "@/routes/welcome/WelcomePage";
import LoginPage from "@/routes/login/LoginPage";
import OnboardingPage from "@/routes/onboarding/OnboardingPage";
import FarmerHome from "@/routes/farmer/FarmerHome";
import MePage from "@/routes/farmer/MePage";
import ScanPage from "@/routes/farmer/ScanPage";
import ScanResultPage from "@/routes/farmer/ScanResultPage";
import NewLotPage from "@/routes/farmer/NewLotPage";
import BuyerHome from "@/routes/buyer/BuyerHome";
import FpoHome from "@/routes/fpo/FpoHome";
import AdminHome from "@/routes/admin/AdminHome";
import PlaceholderPage from "@/routes/PlaceholderPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<RequireRole roles={["farmer"]} />}>
            <Route element={<AppShell />}>
              <Route path="/farmer" element={<FarmerHome />} />
              <Route path="/farmer/lots" element={<PlaceholderPage titleKey="nav.lots" />} />
              <Route path="/farmer/lots/new" element={<NewLotPage />} />
              <Route path="/farmer/scan" element={<ScanPage />} />
              <Route path="/farmer/scan/result/:id" element={<ScanResultPage />} />
              <Route
                path="/farmer/prices"
                element={<PlaceholderPage titleKey="home.todaysPrice" />}
              />
              <Route path="/farmer/khata" element={<PlaceholderPage titleKey="nav.khata" />} />
              <Route path="/farmer/me" element={<MePage />} />
            </Route>
          </Route>

          <Route element={<RequireRole roles={["buyer"]} />}>
            <Route element={<AppShell />}>
              <Route path="/buyer" element={<BuyerHome />} />
            </Route>
          </Route>

          <Route element={<RequireRole roles={["fpo"]} />}>
            <Route element={<AppShell />}>
              <Route path="/fpo" element={<FpoHome />} />
            </Route>
          </Route>

          <Route element={<RequireRole roles={["admin", "nbfc"]} />}>
            <Route element={<AppShell />}>
              <Route path="/admin" element={<AdminHome />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
