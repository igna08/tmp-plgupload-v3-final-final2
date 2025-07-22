import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Laptop,
  X
} from 'lucide-react';

interface NavLinkProps {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  isActive?: boolean;
  badge?: number;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href, icon, children, isActive, badge, onClick }) => {
  const router = useRouter();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onClick) {
      onClick();
    }
    router.push(href);
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group text-left
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
    </button>
  );
};

interface SidebarProps {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  currentPath?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, onMobileClose, currentPath = '/' }) => {
  // Cerrar el sidebar cuando se presiona Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileOpen && onMobileClose) {
        onMobileClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen, onMobileClose]);

  // Prevenir el scroll del body cuando el sidebar está abierto en móvil
  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileOpen]);

  const navItems = [
    { 
      label: 'Dashboard', 
      href: '/dashboard', 
      icon: <Home size={20} />, 
      isActive: currentPath === '/dashboard' || currentPath === '/'
    },
    { 
      label: 'Escuelas', 
      href: '/schools', 
      icon: <School size={20} />,
      isActive: currentPath.includes('/schools')
    },
    { 
      label: 'Activos', 
      href: '/assets', 
      icon: <Laptop size={20} />,
      isActive: currentPath.includes('/assets')
    },
    {
      label: 'Categorías',
      href: '/admin/assets/categories',
      icon: <FileText size={20} />,
      isActive: currentPath.includes('/categories')
    },
    { 
      label: 'Aulas', 
      href: '/admin/classrooms', 
      icon: <Building size={20} />,
      isActive: currentPath.includes('/classrooms')
    },
    { 
      label: 'Usuarios', 
      href: '/users', 
      icon: <Users size={20} />,
      isActive: currentPath.includes('/users')
    },
    { 
      label: 'Incidentes', 
      href: '/incidents', 
      icon: <AlertTriangle size={20} />, 
      badge: 3,
      isActive: currentPath.includes('/incidents')
    },
    { 
      label: 'Reportes', 
      href: '/reports', 
      icon: <BarChart3 size={20} />,
      isActive: currentPath.includes('/reports')
    },
    { 
      label: 'Plantillas', 
      href: '/admin/assets/templates', 
      icon: <FileText size={20} />,
      isActive: currentPath.includes('/templates')
    }
  ];

  const adminItems = [
    { 
      label: 'Configuración', 
      href: '/admin/settings', 
      icon: <Settings size={20} />,
      isActive: currentPath.includes('/settings')
    }
  ];

  const handleLinkClick = () => {
    // Cerrar el sidebar en móvil cuando se hace clic en un enlace
    if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isMobileOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 md:hidden" 
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 shadow-lg
                    transform ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} 
                    md:translate-x-0 transition-transform duration-300 ease-in-out
                    md:relative md:h-auto md:shadow-sm flex-shrink-0`}
        aria-label="Sidebar"
      >
        {/* Header del sidebar móvil */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200 md:justify-center">
          <div className="flex items-center justify-center">
            <img 
              src="/issa.png" 
              alt="Scanly Logo" 
              className="h-10 w-auto object-contain"
            />
          </div>
          
          {/* Botón para cerrar en móvil */}
          <button
            onClick={onMobileClose}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 md:hidden transition-colors"
            aria-label="Cerrar menú"
          >
            <X size={20} />
          </button>
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
                  onClick={handleLinkClick}
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
                  isActive={item.isActive}
                  onClick={handleLinkClick}
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