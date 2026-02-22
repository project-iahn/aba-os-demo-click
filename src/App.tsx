import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "@/context/AppContext";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
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

function ProtectedRoutes() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <AppProvider>
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
    </AppProvider>
  );
}

function AuthGuard() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  if (session) {
    return <Navigate to="/dashboard" replace />;
  }

  return <AuthPage />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<AuthGuard />} />
            <Route path="/*" element={<ProtectedRoutes />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
