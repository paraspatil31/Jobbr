import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Auth from "@/pages/Auth";
import Users from "@/pages/Users";
import SeekerDashboard from "@/pages/SeekerDashboard";
import RecruiterDashboard from "@/pages/RecruiterDashboard";
import MapExplorer from "@/pages/MapExplorer";
import SeekerProfile from "@/pages/SeekerProfile";
import AppliedJobs from "@/pages/AppliedJobs";
import SavedJobs from "@/pages/SavedJobs";
import { getUser } from "@/lib/api";

const queryClient = new QueryClient();

/** Redirects to /auth if not logged in. */
function RequireAuth({ children }: { children: React.ReactNode }) {
  const user = getUser();
  if (!user) return <Redirect to="/auth" />;
  return <>{children}</>;
}

/** Redirects to /auth if not logged in, or to home if wrong role. */
function RequireRole({
  role,
  children,
}: {
  role: "seeker" | "recruiter";
  children: React.ReactNode;
}) {
  const user = getUser();
  if (!user) return <Redirect to="/auth" />;
  if (user.role !== role) return <Redirect to="/" />;
  return <>{children}</>;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />

      {/* Protected: seeker only */}
      <Route path="/dashboard/seeker">
        <RequireRole role="seeker">
          <SeekerDashboard />
        </RequireRole>
      </Route>
      <Route path="/profile">
        <RequireRole role="seeker">
          <SeekerProfile />
        </RequireRole>
      </Route>
      <Route path="/applied-jobs">
        <RequireRole role="seeker">
          <AppliedJobs />
        </RequireRole>
      </Route>
      <Route path="/saved-jobs">
        <RequireRole role="seeker">
          <SavedJobs />
        </RequireRole>
      </Route>

      {/* Protected: recruiter only */}
      <Route path="/dashboard/recruiter">
        <RequireRole role="recruiter">
          <RecruiterDashboard />
        </RequireRole>
      </Route>

      {/* Protected: any logged-in user */}
      <Route path="/explore">
        <RequireAuth>
          <MapExplorer />
        </RequireAuth>
      </Route>
      <Route path="/users">
        <RequireAuth>
          <Users />
        </RequireAuth>
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
