import { Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from '../layouts/AppLayout';
import { useAuthStore } from '../store/authStore';
import Login from '../modules/auth/pages/Login';
import Register from '../modules/auth/pages/Register';

// Temporary placeholders until we build real pages in Phase 2 & 3
const Home = () => (
  <div className="flex flex-col items-center justify-center flex-1 py-32">
    <h1 className="text-5xl font-extrabold tracking-tight text-white mb-6">
      Code Together, <span className="text-indigo-500">Instantly.</span>
    </h1>
    <p className="text-xl text-gray-400 max-w-2xl text-center">
      A premium real-time collaborative coding environment. Create a room, invite friends, and build something amazing.
    </p>
  </div>
);

const Dashboard = () => (
  <div className="max-w-7xl mx-auto px-4 py-10 w-full">
    <h1 className="text-3xl font-bold text-white">Your Dashboard</h1>
    <p className="text-gray-400 mt-2">This is where your rooms will appear.</p>
  </div>
);

// Protected Route Wrapper Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
