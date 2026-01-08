import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { KitchenLayout } from './components/KitchenLayout';
import { ProductLab } from './pages/ProductLab';
import { SalesSimulator } from './pages/SalesSimulator';
import { IngredientsPage } from './pages/IngredientsPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { RecipeListPage } from './pages/RecipeListPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<KitchenLayout />}>
          <Route path="/" element={<Navigate to="/recipes" replace />} />
          <Route path="/recipes" element={<RecipeListPage />} />
          <Route path="/recipes/new" element={<ProductLab />} />
          <Route path="/recipes/:id" element={<ProductLab />} />
          <Route path="/ingredients" element={<IngredientsPage />} />
          <Route path="/expenses" element={<ExpensesPage />} />
          <Route path="/simulator" element={<SalesSimulator />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
