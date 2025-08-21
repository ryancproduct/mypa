import Dashboard from './pages/Dashboard';
import { PWAPrompt } from './components/PWAPrompt';

function App() {
  return (
    <div className="min-h-screen bg-neutral-25 dark:bg-neutral-950 transition-colors duration-200">
      <Dashboard />
      <PWAPrompt />
    </div>
  );
}

export default App;
