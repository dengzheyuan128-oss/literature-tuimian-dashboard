import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { CompareProvider } from "./contexts/CompareContext";
import { ReminderProvider } from "./contexts/ReminderContext";
import ProtectedRoute from "./components/ProtectedRoute";
import BaiduAnalytics from "./components/BaiduAnalytics";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Matcher from "./pages/Matcher";
import MatchResult from "./pages/MatchResult";
import Compare from "./pages/Compare";
import Reminders from "./pages/Reminders";
import Analytics from "./pages/Analytics";
import { BuildInfo } from "./components/BuildInfo";


function Router() {
  return (
    <Switch>
      {/* 公开页面 */}
      <Route path={"/"} component={Landing} />
      <Route path={"/login"} component={Login} />

      {/* 受保护的页面 - 需要登录 */}
      <Route path={"/dashboard"}>
        <ProtectedRoute><Home /></ProtectedRoute>
      </Route>
      <Route path={"/profile"}>
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>
      <Route path={"/matcher"}>
        <ProtectedRoute><Matcher /></ProtectedRoute>
      </Route>
      <Route path={"/match-result"}>
        <ProtectedRoute><MatchResult /></ProtectedRoute>
      </Route>
      <Route path={"/compare"}>
        <ProtectedRoute><Compare /></ProtectedRoute>
      </Route>
      <Route path={"/reminders"}>
        <ProtectedRoute><Reminders /></ProtectedRoute>
      </Route>
      <Route path={"/analytics"}>
        <ProtectedRoute><Analytics /></ProtectedRoute>
      </Route>

      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <AuthProvider>
          <CompareProvider>
            <ReminderProvider>
              <TooltipProvider>
                <Toaster />
                <BaiduAnalytics />
                <div className="relative">
                  <Router />
                  <div className="fixed bottom-4 right-4 z-40 bg-card/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg">
                    <BuildInfo />
                  </div>
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
