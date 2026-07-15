import { Routes, Route, Navigate } from 'react-router-dom';
import Layout        from './components/layout/Layout';
import SuppliersPage from './pages/SuppliersPage';
import CarsPage      from './pages/CarsPage';
import PartsPage     from './pages/PartsPage';
import ImportPage    from './pages/ImportPage';
import SearchPage    from './pages/SearchPage';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Navigate to="/suppliers" replace />} />
        <Route path="/suppliers" element={<SuppliersPage />} />
        <Route path="/suppliers/:supplierId/cars" element={<CarsPage />} />
        <Route path="/suppliers/:supplierId/cars/:carId/parts" element={<PartsPage />} />
        <Route path="/import" element={<ImportPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="*" element={<Navigate to="/suppliers" replace />} />
      </Route>
    </Routes>
  );
}
