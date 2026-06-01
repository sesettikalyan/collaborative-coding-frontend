import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { Code2, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuthStore();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 transition-opacity hover:opacity-80">
          <Code2 className="h-6 w-6 text-indigo-500" />
          <span className="text-xl font-bold tracking-tight text-white">CollabCode</span>
        </Link>
        
        {/* Actions */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <>
              <Link to="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
                Dashboard
              </Link>
              <div className="h-5 w-px bg-gray-700" />
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <User className="h-4 w-4" />
                <span>{user?.username || 'User'}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700 hover:text-white"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
