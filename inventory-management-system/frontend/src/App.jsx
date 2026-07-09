import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layout
import DashboardLayout from './Pages/DashboardLayout/DashboardLayout';

// Auth
import SignIn from './Pages/Signin/Signin';

// Admin Pages
import Dashboard from './Pages/Dashboard/Dashboard';
import Products from './Pages/Products/Products';
import Categories from './Pages/Categories/Categories';
import Stockin from './Pages/Stockin/Stockin';
import Stockout from './Pages/Stockout/Stockout';
import Reports from './Pages/Reports/Reports';
import Approval from './Pages/Approval/Approval';

// User Pages
import UserDashboard from './Pages/UserDashboard/UserDashboard';
import UserStockIn from './Pages/UserStockIn/UserStockIn';
import UserStockOut from './Pages/UserStockOut/UserStockOut';
import UserReports from './Pages/UserReports/UserReports';
import UserProfile from './Pages/UserProfile/UserProfile';
import UserRequests from './Pages/UserRequests/UserRequests';


/** Derive the home path based on user role */
function homePath(role) {
  if (role === 'Admin' || role === 'Manager') return '/admin/dashboard';
  return '/user/dashboard';
}

/**
 * Guard: redirect to /login if not authenticated.
 * If a specific `roles` array is provided, also verify the user has one of those roles.
 */
function RequireAuth({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={homePath(user.role)} replace />;
  }

  return children;
}

/** Guard: redirect to role-appropriate dashboard if already authenticated */
function RequireGuest({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={homePath(user.role)} replace />;
  }
  return children;
}

export default function App() {
  // Apply saved theme on mount
  useEffect(() => {
    const saved = localStorage.getItem('nova-theme') || 'light';
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <Routes>
      {/* Public — sign in */}
      <Route
        path="/login"
        element={
          <RequireGuest>
            <SignIn />
          </RequireGuest>
        }
      />

      {/* Redirect root to login */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* ─────────────── ADMIN / MANAGER routes ─────────────── */}
      <Route
        path="/admin/dashboard"
        element={
          <RequireAuth roles={['Admin', 'Manager']}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Dashboard />} />
        {/* Admin & Manager can manage products/categories */}
        <Route path="products"    element={<RequireAuth roles={['Admin', 'Manager']}><Products /></RequireAuth>} />
        <Route path="categories"  element={<RequireAuth roles={['Admin', 'Manager']}><Categories /></RequireAuth>} />
        {/* All admin roles can do stock operations */}
        <Route path="stock-in"   element={<Stockin />} />
        <Route path="stock-out"  element={<Stockout />} />
        {/* Admin only for approvals */}
        <Route path="reports/:tab?" element={<RequireAuth roles={['Admin', 'Manager']}><Reports /></RequireAuth>} />
        <Route path="approval"   element={<RequireAuth roles={['Admin']}><Approval /></RequireAuth>} />
        <Route path="profile"    element={<UserProfile />} />
      </Route>

      {/* ─────────────── USER / STAFF routes ─────────────── */}
      <Route
        path="/user/dashboard"
        element={
          <RequireAuth roles={['Staff']}>
            <DashboardLayout />
          </RequireAuth>
        }
      >
        <Route index element={<UserDashboard />} />
        <Route path="stock-in"    element={<UserStockIn />} />
        <Route path="stock-out"   element={<UserStockOut />} />
        <Route path="products"    element={<Products />} />
        <Route path="reports/:tab?" element={<UserReports />} />
        <Route path="profile"     element={<UserProfile />} />
        <Route path="my-requests" element={<UserRequests />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
