import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import CREDashboard from './pages/CREDashboard';
import CleanerDashboard from './pages/CleanerDashboard';
import AdminPanel from './pages/AdminPanel';

function ProtectedRoute({ children, roleRequired }) {
  const { isAuthenticated, role } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (roleRequired && role !== roleRequired) {
    // If role mismatch, bounce them to their valid home
    if (role === 'ADMIN') return <Navigate to="/admin" replace />;
    if (role === 'CRE') return <Navigate to="/cre" replace />;
    if (role === 'CLEANER') return <Navigate to="/cleaner" replace />;
  }
  
  return children;
}

export default function App() {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      
      {/* Root redirect */}
      <Route 
        path="/" 
        element={
          !isAuthenticated ? <Navigate to="/login" replace /> :
          role === 'ADMIN' ? <Navigate to="/admin" replace /> :
          role === 'CRE' ?   <Navigate to="/cre" replace /> :
          <Navigate to="/cleaner" replace />
        } 
      />
      
      {/* CRE Routes */}
      <Route 
        path="/cre" 
        element={
          <ProtectedRoute roleRequired="CRE">
            <CREDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Cleaner Routes */}
      <Route 
        path="/cleaner" 
        element={
          <ProtectedRoute roleRequired="CLEANER">
            <CleanerDashboard />
          </ProtectedRoute>
        } 
      />
      
      {/* Admin Routes */}
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute roleRequired="ADMIN">
            <AdminPanel />
          </ProtectedRoute>
        } 
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
