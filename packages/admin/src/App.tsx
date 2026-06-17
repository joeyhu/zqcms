import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ConfirmProvider } from './components/ui/ConfirmDialog';
import { AdminLayout } from './components/layout/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { PostListPage } from './pages/PostListPage';
import { PostFormPage } from './pages/PostFormPage';
import { CategoryListPage } from './pages/CategoryListPage';
import { CategoryFormPage } from './pages/CategoryFormPage';
import { SettingsPage } from './pages/SettingsPage';
import { MediaPage } from './pages/MediaPage';
import { PageBuilderPage } from './pages/PageBuilderPage';
import { SitesPage } from './pages/SitesPage';
import { SiteFormPage } from './pages/SiteFormPage';
import { TagListPage } from './pages/TagListPage';
import { TagFormPage } from './pages/TagFormPage';
import { CardTemplateListPage } from './pages/CardTemplateListPage';
import { CardTemplateFormPage } from './pages/CardTemplateFormPage';
import { BlockTemplateListPage } from './pages/BlockTemplateListPage';
import { BlockTemplateFormPage } from './pages/BlockTemplateFormPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('zqcms_token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export function App() {
  return (
    <BrowserRouter>
      <ConfirmProvider>
        <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="posts" element={<PostListPage />} />
          <Route path="posts/new" element={<PostFormPage />} />
          <Route path="posts/:id/edit" element={<PostFormPage />} />
          <Route path="categories" element={<CategoryListPage />} />
          <Route path="categories/new" element={<CategoryFormPage />} />
          <Route path="categories/:id/edit" element={<CategoryFormPage />} />
          <Route path="pages/home" element={<PageBuilderPage />} />
          <Route path="pages/category" element={<PageBuilderPage />} />
          <Route path="pages/subcategory" element={<PageBuilderPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="media" element={<MediaPage />} />
          <Route path="sites" element={<SitesPage />} />
          <Route path="sites/new" element={<SiteFormPage />} />
          <Route path="sites/:id/edit" element={<SiteFormPage />} />
          <Route path="tags" element={<TagListPage />} />
          <Route path="tags/new" element={<TagFormPage />} />
          <Route path="tags/:id/edit" element={<TagFormPage />} />
          <Route path="cards" element={<CardTemplateListPage />} />
          <Route path="cards/new" element={<CardTemplateFormPage />} />
          <Route path="cards/:id/edit" element={<CardTemplateFormPage />} />
          <Route path="blocks" element={<BlockTemplateListPage />} />
          <Route path="blocks/new" element={<BlockTemplateFormPage />} />
          <Route path="blocks/:id/edit" element={<BlockTemplateFormPage />} />
        </Route>
      </Routes>
      </ConfirmProvider>
    </BrowserRouter>
  );
}
