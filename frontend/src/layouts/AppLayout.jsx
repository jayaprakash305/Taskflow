import { useState, useCallback } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Iridescence from "../components/Iridescence";
import { useTheme } from "../hooks/useTheme";

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme } = useTheme();

  const openSidebar = useCallback(() => setSidebarOpen(true), []);
  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  // Adjust iridescence color based on theme
  const iridescenceColor = theme === "dark"
    ? [0.3, 0.2, 0.5]   // deep purple tones for dark mode
    : [0.6, 0.5, 0.8];   // softer lavender for light mode

  return (
    <div className="flex h-screen bg-bg text-text" style={{ position: 'relative' }}>
      {/* Iridescence background */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: theme === 'dark' ? 0.45 : 0.25,
        pointerEvents: 'none',
      }}>
        <Iridescence
          color={iridescenceColor}
          speed={0.8}
          amplitude={0.1}
          mouseReact={false}
        />
      </div>

      <Sidebar mobileOpen={sidebarOpen} onClose={closeSidebar} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden" style={{ position: 'relative', zIndex: 1 }}>
        <Navbar onMenuToggle={openSidebar} />
        <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;