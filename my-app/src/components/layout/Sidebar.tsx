import React from 'react';
import { 
  Home, 
  School, 
  Package, 
  Settings, 
  Users, 
  BarChart3,
  FileText,
  AlertTriangle,
  Building,
  Laptop
} from 'lucide-react';

interface NavLinkProps {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  badge?: number; // For notification badges
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, children, isActive, badge }) => {
  return (
    <a
      href={href}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                  ${isActive 
                    ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600' 
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                  }`}
    >
      <div className="flex items-center space-x-3">
        {icon && (
          <span className={`transition-colors duration-200 ${
            isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'
          }`}>
            {icon}
          </span>
        )}
        <span>{children}</span>
      </div>
      {badge && badge > 0 && (
        <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </a>
  );
};

interface SidebarProps {
  isMobileOpen?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen }) => {
  const navItems = [
    { 
      label: 'Dashboard', 
      href: '/', 
      icon: <Home size={20} />, 
      isActive: true 
    },
    { 
      label: 'Escuelas', 
      href: '/schools', 
      icon: <School size={20} /> 
    },
    { 
      label: 'Activos', 
      href: '/assets', 
      icon: <Laptop size={20} /> 
    },
    {
      label: 'categorías',
      href: '/admin/assets/categories',
      icon: <FileText size={20} />
    },
    { 
      label: 'Aulas', 
      href: '/admin/classrooms', 
      icon: <Building size={20} /> 
    },
    { 
      label: 'Usuarios', 
      href: '/users', 
      icon: <Users size={20} /> 
    },
    { 
      label: 'Incidentes', 
      href: '/incidents', 
      icon: <AlertTriangle size={20} />, 
      badge: 3 
    },
    { 
      label: 'Reportes', 
      href: '/reports', 
      icon: <BarChart3 size={20} /> 
    },
    { 
      label: 'Plantillas', 
      href: '/admin/assets/templates', 
      icon: <FileText size={20} /> 
    }
  ];

  const adminItems = [
    { 
      label: 'Configuración', 
      href: '/admin/settings', 
      icon: <Settings size={20} /> 
    }
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 md:hidden" />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-sm
                    transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0 transition-transform duration-300 ease-in-out
                    md:relative md:h-auto flex-shrink-0`}
        aria-label="Sidebar"
      >
        {/* Logo Section */}
        <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200">
          <div className="flex items-center justify-center">
            <img 
              src="/logo.png" 
              alt="Scanly Logo" 
              className="h-10 w-auto object-contain"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
          {/* Main Navigation */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Principal
            </h3>
            <div className="space-y-1">
              {navItems.map((item) => (
                <NavLink 
                  key={item.label} 
                  href={item.href} 
                  icon={item.icon}
                  isActive={item.isActive}
                  badge={item.badge}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Admin Section */}
          <div>
            <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Administración
            </h3>
            <div className="space-y-1">
              {adminItems.map((item) => (
                <NavLink 
                  key={item.label} 
                  href={item.href} 
                  icon={item.icon}
                >
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                Sistema v2.1.0
              </p>
              <p className="text-xs text-gray-500">
                Última actualización
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;