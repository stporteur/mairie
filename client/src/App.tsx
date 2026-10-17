import { PAGES } from '@/config/constants';
import { useNavigation } from '@/hooks/useNavigation';
import { usePlanningPage } from '@/hooks/usePlanningPage';
import ForecastPage from './components/forecast/ForecastPage';
import PageBanner from './components/layout/PageBanner';
import Sidebar from './components/layout/Sidebar';
import PlanningPage from './components/planning/PlanningPage';

function App() {
  const navigation = useNavigation();
  const planning = usePlanningPage();
  const page = PAGES[navigation.activePage];

  return (
    <div className={`portal-shell ${!navigation.sidebarOpen ? 'sidebar-closed' : ''}`}>
      <Sidebar
        open={navigation.sidebarOpen}
        activePage={navigation.activePage}
        onSelectPage={navigation.onSelectPage}
        onToggle={navigation.onToggleSidebar}
      />
      <main className="main-content">
        <PageBanner title={page.title} subtitle={page.subtitle} />
        {navigation.activePage === 'planning' ? (
          <PlanningPage model={planning} />
        ) : (
          <ForecastPage
            key={`${planning.year}-${planning.profile}`}
            startYear={planning.year}
            initialSettings={planning.settings}
            initialProfile={planning.profile}
          />
        )}
      </main>
    </div>
  );
}

export default App;
