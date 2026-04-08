import { LocationProvider, Router, Route } from "preact-iso";
import { Nav } from "./components/Nav";
import { Dashboard } from "./pages/Dashboard";
import { Sleep } from "./pages/Sleep";
import { Activities } from "./pages/Activities";
import { Training } from "./pages/Training";
import { Trends } from "./pages/Trends";
import { HeartRate } from "./pages/HeartRate";
import { StressBodyBattery } from "./pages/StressBodyBattery";

export function App() {
  return (
    <LocationProvider>
      <div class="app">
        <Nav />
        <Router>
          <Route path="/" component={Dashboard} />
          <Route path="/sleep" component={Sleep} />
          <Route path="/activities" component={Activities} />
          <Route path="/training" component={Training} />
          <Route path="/heart-rate" component={HeartRate} />
          <Route path="/stress" component={StressBodyBattery} />
          <Route path="/trends" component={Trends} />
        </Router>
      </div>
    </LocationProvider>
  );
}
