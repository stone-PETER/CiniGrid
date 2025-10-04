import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { id: 'board', label: 'Board', path: '/board' },
    { id: 'scenes', label: 'Scenes', path: '/scenes' },
    { id: 'tasks', label: 'Tasks', path: '/tasks' },
    { id: 'locations', label: 'Locations', path: '/locations' },
  ];

  const currentPath = location.pathname;

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#7A7A7A' }}>
      {/* Header - Two Lines */}
      <header className="sticky top-0 z-50">
        {/* First Line - Product Name */}
        <div className="h-12 flex items-center justify-center" style={{ backgroundColor: '#1F1F1F' }}>
          <h1 
            className="text-2xl font-bold tracking-wide"
            style={{ color: '#FCCA00' }}
          >
            CiniGrid
          </h1>
        </div>
        
        {/* Second Line - Navigation */}
        <nav className="h-12" style={{ backgroundColor: '#FCCA00' }}>
          <div className="h-full flex items-center justify-center">
            <div className="flex space-x-1">
              {navigationItems.map((item) => {
                const isActive = currentPath === item.path || 
                  (item.path === '/locations' && (currentPath === '/' || currentPath === '/scout'));
                
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavigation(item.path)}
                    className={`px-6 py-2 font-bold text-sm transition-all duration-200 ${
                      isActive
                        ? 'bg-black text-white shadow-inner'
                        : 'hover:bg-black hover:bg-opacity-10'
                    }`}
                    style={{ 
                      color: isActive ? '#FFFFFF' : '#1F1F1F',
                      backgroundColor: isActive ? '#1F1F1F' : 'transparent'
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-96px)]">
        {children}
      </main>
    </div>
  );
};

export default Layout;