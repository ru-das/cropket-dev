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
import LotsPage from "@/routes/farmer/LotsPage";
import NewLotPage from "@/routes/farmer/NewLotPage";
import LotDetailPage from "@/routes/farmer/LotDetailPage";
import BidsPage from "@/routes/farmer/BidsPage";
import ConsentPage from "@/routes/farmer/ConsentPage";
import ComparePage from "@/routes/farmer/ComparePage";
import PricesPage from "@/routes/farmer/PricesPage";
import KhataPage from "@/routes/farmer/KhataPage";
import BuyerHome from "@/routes/buyer/BuyerHome";
import BuyerLotDetailPage from "@/routes/buyer/BuyerLotDetailPage";
import BuyerMegaLotDetailPage from "@/routes/buyer/BuyerMegaLotDetailPage";
import BuyerDealPage from "@/routes/buyer/BuyerDealPage";
import KycPage from "@/routes/buyer/KycPage";
import FpoHome from "@/routes/fpo/FpoHome";
import AdminHome from "@/routes/admin/AdminHome";
import AdminKycPage from "@/routes/admin/AdminKycPage";
import AdminEscrowsPage from "@/routes/admin/AdminEscrowsPage";
import TripPage from "@/routes/trip/TripPage";

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/login" element={<LoginPage />} />
        {/* The driver's page (SPEC.md §3.1, §4.16) - no login, no AppShell
            (no bottom nav, no header - the token in the URL is the only
            credential, CLAUDE.md §3). */}
        <Route path="/t/:token" element={<TripPage />} />

        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<OnboardingPage />} />

          <Route element={<RequireRole roles={["farmer"]} />}>
            <Route element={<AppShell />}>
              <Route path="/farmer" element={<FarmerHome />} />
              <Route path="/farmer/lots" element={<LotsPage />} />
              <Route path="/farmer/lots/new" element={<NewLotPage />} />
              <Route path="/farmer/lots/:id" element={<LotDetailPage />} />
              <Route path="/farmer/lots/:id/bids" element={<BidsPage />} />
              <Route path="/farmer/lots/:id/bids/:bidId/consent" element={<ConsentPage />} />
              <Route path="/farmer/lots/:id/compare" element={<ComparePage />} />
              <Route path="/farmer/scan" element={<ScanPage />} />
              <Route path="/farmer/scan/result/:id" element={<ScanResultPage />} />
              <Route path="/farmer/prices" element={<PricesPage />} />
              <Route path="/farmer/khata" element={<KhataPage />} />
              <Route path="/farmer/me" element={<MePage />} />
            </Route>
          </Route>

          <Route element={<RequireRole roles={["buyer"]} />}>
            <Route element={<AppShell />}>
              <Route path="/buyer" element={<BuyerHome />} />
              <Route path="/buyer/lots/:id" element={<BuyerLotDetailPage />} />
              <Route path="/buyer/mega-lots/:id" element={<BuyerMegaLotDetailPage />} />
              <Route path="/buyer/deals/:id" element={<BuyerDealPage />} />
              <Route path="/buyer/kyc" element={<KycPage />} />
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
              <Route path="/admin/kyc" element={<AdminKycPage />} />
              <Route path="/admin/escrows" element={<AdminEscrowsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
