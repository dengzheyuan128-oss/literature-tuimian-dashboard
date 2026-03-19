import { Route, Switch } from "wouter";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import BaiduAnalytics from "./components/BaiduAnalytics";
import { BuildInfo } from "./components/BuildInfo";
import ErrorBoundary from "./components/ErrorBoundary";
import FeedbackButton from "./components/FeedbackButton";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import { CompareProvider } from "./contexts/CompareContext";
import { ReminderProvider } from "./contexts/ReminderContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import AdminExtract from "./pages/AdminExtract";
import AdminNoticeReview from "./pages/AdminNoticeReview";
import Analytics from "./pages/Analytics";
import Compare from "./pages/Compare";
import DataSourcesDisclaimer from "./pages/DataSourcesDisclaimer";
import FeedbackContact from "./pages/FeedbackContact";
import Home from "./pages/Home";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Matcher from "./pages/Matcher";
import MatchResult from "./pages/MatchResult";
import NotFound from "./pages/NotFound";
import NoticeDetail from "./pages/NoticeDetail";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Profile from "./pages/Profile";
import Reminders from "./pages/Reminders";
import SubmitNotice from "./pages/SubmitNotice";
import TermsOfService from "./pages/TermsOfService";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Landing} />
      <Route path="/login" component={Login} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/data-sources" component={DataSourcesDisclaimer} />
      <Route path="/feedback" component={FeedbackContact} />

      <Route path="/dashboard">
        <ProtectedRoute>
          <Home />
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Profile />
        </ProtectedRoute>
      </Route>
      <Route path="/matcher">
        <ProtectedRoute>
          <Matcher />
        </ProtectedRoute>
      </Route>
      <Route path="/match-result">
        <ProtectedRoute>
          <MatchResult />
        </ProtectedRoute>
      </Route>
      <Route path="/compare">
        <ProtectedRoute>
          <Compare />
        </ProtectedRoute>
      </Route>
      <Route path="/reminders">
        <ProtectedRoute>
          <Reminders />
        </ProtectedRoute>
      </Route>
      <Route path="/analytics">
        <ProtectedRoute>
          <Analytics />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/extract">
        <ProtectedRoute>
          <AdminExtract />
        </ProtectedRoute>
      </Route>
      <Route path="/admin/review">
        <ProtectedRoute>
          <AdminNoticeReview />
        </ProtectedRoute>
      </Route>
      <Route path="/submit-notice">
        <ProtectedRoute>
          <SubmitNotice />
        </ProtectedRoute>
      </Route>
      <Route path="/notice/:id">
        <ProtectedRoute>
          <NoticeDetail />
        </ProtectedRoute>
      </Route>

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <AuthProvider>
          <CompareProvider>
            <ReminderProvider>
              <TooltipProvider>
                <Toaster />
                <BaiduAnalytics />
                <FeedbackButton />
                <div className="relative">
                  <Router />
                  <BuildInfo />
                </div>
              </TooltipProvider>
            </ReminderProvider>
          </CompareProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
