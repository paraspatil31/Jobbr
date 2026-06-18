import { Switch, Route, Router as WouterRouter } from "wouter";
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

const queryClient = new QueryClient();

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/auth" component={Auth} />
      <Route path="/users" component={Users} />
      <Route path="/dashboard/seeker" component={SeekerDashboard} />
      <Route path="/dashboard/recruiter" component={RecruiterDashboard} />
      <Route path="/explore" component={MapExplorer} />
      <Route path="/profile" component={SeekerProfile} />
      <Route path="/applied-jobs" component={AppliedJobs} />
      <Route path="/saved-jobs" component={SavedJobs} />
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
