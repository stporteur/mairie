import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import PlanningProvider from '@/components/providers/PlanningProvider';
import { DEFAULT_PAGE, PAGES } from '@/pages/pageRegistry';

function App() {
  return (
    <BrowserRouter>
      <PlanningProvider>
        <Routes>
          <Route element={<AppLayout />}>
            <Route index element={<Navigate to={`/${DEFAULT_PAGE.path}`} replace />} />
            {PAGES.map(({ path, component: Page }) => (
              <Route key={path} path={`${path}/*`} element={<Page />} />
            ))}
            <Route path="*" element={<Navigate to={`/${DEFAULT_PAGE.path}`} replace />} />
          </Route>
        </Routes>
      </PlanningProvider>
    </BrowserRouter>
  );
}

export default App;
