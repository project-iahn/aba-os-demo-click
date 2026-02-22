import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import CasesList from "./pages/CasesList";
import CaseDetail from "./pages/CaseDetail";
import SessionsPage from "./pages/SessionsPage";
import ReportsPage from "./pages/ReportsPage";
import ParentSessionSummary from "./pages/ParentSessionSummary";
import SettingsPage from "./pages/SettingsPage";
import MigrationPage from "./pages/MigrationPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";
import { RoleRedirect } from "./components/RoleRedirect";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <AppProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/*" element={
                <AppLayout>
                  <Routes>
                    <Route path="/" element={<RoleRedirect />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/cases" element={<CasesList />} />
                    <Route path="/cases/:id" element={<CaseDetail />} />
                    <Route path="/sessions" element={<SessionsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/session-summary" element={<ParentSessionSummary />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/migration" element={<MigrationPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </AppLayout>
              } />
            </Routes>
          </BrowserRouter>
        </AppProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
