import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

/**
 * AppLayout
 * 
 * Wraps the entire application with global aesthetics.
 * Uses flexbox to ensure the footer stays at the bottom if we add one.
 * Uses Framer Motion aesthetic color palettes (Deep dark backgrounds).
 */
export default function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col font-sans selection:bg-indigo-500/30">
      <Navbar />
      <main className="flex-1 w-full flex flex-col">
        {/* Outlet renders the matched child route */}
        <Outlet />
      </main>
    </div>
  );
}
