"use client";
import { useAuth } from '@/context/AuthContext';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter, usePathname } from 'next/navigation';
import { 
  Search, 
  Bell, 
  User, 
  Menu, 
  X, 
  LogOut, 
  ChevronDown,
  Package,
  Home,
  ChevronRight
} from 'lucide-react';

// API Configuration
const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

// Interfaces
interface User {
  id: string;
  full_name: string;
  email: string;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
}

interface Incident {
  id: string;
  description: string;
  asset_id: string;
  status: string;
  reported_by: string;
  reported_at: string;
  resolved_at: string | null;
  photo_url?: string;
}

interface BreadcrumbItem {
  label: string;
  href?: string;
  isActive?: boolean;
}

interface TopBarProps {
  onMobileMenuToggle?: () => void;
  isMobileMenuOpen?: boolean;
  pageTitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

const TopBar: React.FC<TopBarProps> = ({ 
  onMobileMenuToggle, 
  isMobileMenuOpen,
  pageTitle,
  breadcrumbs,
  onSearch,
  searchPlaceholder = "Buscar activos, escuelas, usuarios..."
}) => {
  const router = useRouter?.() || null;
  const pathname = usePathname?.() || '';
  const { logout } = useAuth();

  // State
  const [user, setUser] = useState<User | null>(null);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [isLoadingIncidents, setIsLoadingIncidents] = useState(false);
  const [logoError, setLogoError] = useState(false);

  // Handle logo error
  const handleLogoError = () => {
    setLogoError(true);
  };

  // Función para generar breadcrumbs automáticamente basado en la URL
  const generateBreadcrumbsFromPath = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(segment => segment);

    const breadcrumbMap: { [key: string]: string } = {
      'dashboard': 'Dashboard',
      'schools': 'Escuelas',
      'assets': 'Activos',
      'users': 'Usuarios',
      'incidents': 'Incidentes',
      'reports': 'Reportes',
      'settings': 'Configuración',
      'profile': 'Perfil'
    };

    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ];

    let currentPath = '';
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      const isLast = index === pathSegments.length - 1;

      breadcrumbs.push({
        label: breadcrumbMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
        href: isLast ? undefined : currentPath,
        isActive: isLast
      });
    });

    return breadcrumbs;
  };

  // Usar breadcrumbs proporcionados o generar automáticamente
  const finalBreadcrumbs = breadcrumbs || generateBreadcrumbsFromPath();

  // Fetch current user
  const fetchUser = useCallback(async () => {
    try {
      setIsLoadingUser(true);
      const response = await axios.get(`${API_BASE_URL}/users/me`);
      setUser(response.data);
    } catch (error) {
      console.error('Error fetching user:', error);
      setUser(null);
    } finally {
      setIsLoadingUser(false);
    }
  }, []);

  // Fetch incidents for notifications
  const fetchIncidents = useCallback(async () => {
    try {
      setIsLoadingIncidents(true);
      const response = await axios.get(`${API_BASE_URL}/incidents/`, {
        params: { skip: 0, limit: 10 }
      });
      setIncidents(response.data);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setIncidents([]);
    } finally {
      setIsLoadingIncidents(false);
    }
  }, []);

  // Load data on component mount
  useEffect(() => {
    fetchUser();
    fetchIncidents();
  }, [fetchUser, fetchIncidents]);

  // Handle search
  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (onSearch) {
      onSearch(value);
    }
  };

  // Handle search submit
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      if (router) {
        router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      }
    }
  };

  // Refresh incidents when notification dropdown opens
  const handleNotificationToggle = () => {
    if (!isNotificationOpen) {
      fetchIncidents();
    }
    setIsNotificationOpen(!isNotificationOpen);
  };

  // Generate Vercel-style avatar
  const generateVercelAvatar = (name: string): string => {
    const initials = name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);

    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500'
    ];

    const colorIndex = name.length % colors.length;
    return colors[colorIndex];
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora mismo';
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} min`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;

    const diffInDays = Math.floor(diffInHours / 24);
    return `Hace ${diffInDays} día${diffInDays > 1 ? 's' : ''}`;
  };

  // Get incident title based on status
  const getIncidentTitle = (incident: Incident): string => {
    switch (incident.status.toLowerCase()) {
      case 'pending':
        return 'Nuevo incidente reportado';
      case 'in_progress':
        return 'Incidente en progreso';
      case 'resolved':
        return 'Incidente resuelto';
      default:
        return 'Actualización de incidente';
    }
  };

  // Count unread incidents
  const unreadCount = incidents.filter(incident => {
    const incidentDate = new Date(incident.reported_at);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return incidentDate > oneDayAgo && !incident.resolved_at;
  }).length;

  // Logout handler
  const handleLogout = useCallback(() => {
    console.log('[TopBar] Logout initiated');
    logout();
  }, [logout]);

  // Handle breadcrumb navigation
  const handleBreadcrumbClick = (href: string) => {
    if (router && href) {
      router.push(href);
    }
  };

  // Handle mobile menu toggle with proper callback
  const handleMobileMenuToggle = () => {
    console.log('Mobile menu toggle clicked', { current: isMobileMenuOpen });
    if (onMobileMenuToggle) {
      onMobileMenuToggle();
    }
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">

        {/* Left Section */}
        <div className="flex items-center space-x-4">
          {/* Mobile Menu Button - Mejorado */}
          <button
            onClick={handleMobileMenuToggle}
            className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 md:hidden transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
            type="button"
          >
            {isMobileMenuOpen ? (
              <X size={20} className="transition-transform duration-200" />
            ) : (
              <Menu size={20} className="transition-transform duration-200" />
            )}
          </button>

          {/* Logo personalizado para mobile */}
          <div className="flex items-center md:hidden">
            {!logoError ? (
              <img
                src="https://app-web-final-qr.vercel.app/logo.png"
                alt="Logo del Sistema"
                className="h-8 w-auto max-w-[120px] object-contain"
                onError={handleLogoError}
              />
            ) : (
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-2">
                  <Package className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold text-gray-900">Scanly</span>
              </div>
            )}
          </div>

          {/* Dynamic Breadcrumb for desktop */}
          <nav className="hidden md:flex items-center space-x-1 text-sm" aria-label="Breadcrumb">
            {finalBreadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && (
                  <ChevronRight size={14} className="text-gray-400 mx-1" />
                )}
                {breadcrumb.isActive ? (
                  <span className="text-gray-900 font-medium px-2 py-1">
                    {breadcrumb.label}
                  </span>
                ) : (
                  <button
                    onClick={() => breadcrumb.href && handleBreadcrumbClick(breadcrumb.href)}
                    className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                    disabled={!breadcrumb.href}
                  >
                    {breadcrumb.label}
                  </button>
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Page Title for mobile */}
          {pageTitle && (
            <div className="md:hidden">
              <h1 className="text-lg font-semibold text-gray-900 truncate max-w-[200px]">
                {pageTitle}
              </h1>
            </div>
          )}
        </div>

        {/* Center - Enhanced Search Bar */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchValue}
              onChange={(e) => handleSearch(e.target.value)}
              className="block w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg 
                         bg-gray-50 text-sm placeholder-gray-500
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white
                         transition-all duration-200"
            />
            {searchValue && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <button
                  type="button"
                  onClick={() => handleSearch('')}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">

          {/* Mobile Search Button */}
          <button className="p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 md:hidden transition-colors">
            <Search size={20} />
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={handleNotificationToggle}
              className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold 
                               rounded-full h-5 w-5 flex items-center justify-center min-w-[20px]">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {isNotificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                    {unreadCount > 0 && (
                      <span className="text-sm text-blue-600 font-medium">
                        {unreadCount} nuevas
                      </span>
                    )}
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {isLoadingIncidents ? (
                    <div className="p-4 text-center text-gray-500">
                      Cargando notificaciones...
                    </div>
                  ) : incidents.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      No hay notificaciones
                    </div>
                  ) : (
                    incidents.map((incident) => {
                      const isUnread = !incident.resolved_at && 
                        new Date(incident.reported_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

                      return (
                        <div
                          key={incident.id}
                          className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors
                                      ${isUnread ? 'bg-blue-50' : ''}`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                                {getIncidentTitle(incident)}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                {incident.description}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {formatTimeAgo(incident.reported_at)}
                              </p>
                            </div>
                            {isUnread && (
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 ml-2"></div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
                <div className="p-3 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                    Ver todos los incidentes
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
              disabled={isLoadingUser}
            >
              <div className="flex items-center space-x-3">
                {/* Avatar */}
                {isLoadingUser ? (
                  <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                ) : user ? (
                  <div className={`w-8 h-8 ${generateVercelAvatar(user.full_name)} rounded-full flex items-center justify-center`}>
                    <span className="text-white text-sm font-semibold">
                      {user.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                ) : (
                  <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center">
                    <User size={16} className="text-white" />
                  </div>
                )}

                {/* User Info - Hidden on mobile */}
                <div className="hidden sm:block text-left">
                  {isLoadingUser ? (
                    <div className="space-y-1">
                      <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
                      <div className="w-16 h-2 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  ) : user ? (
                    <>
                      <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                      <p className="text-xs text-gray-500 capitalize">{user.status}</p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium text-gray-900">Usuario</p>
                      <p className="text-xs text-gray-500">No conectado</p>
                    </>
                  )}
                </div>
              </div>
              <ChevronDown size={16} className="text-gray-400 hidden sm:block" />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && user && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                  <p className="text-xs text-gray-400 mt-1 capitalize">Estado: {user.status}</p>
                </div>
                <div className="py-2">
                  <button className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors">
                    <User size={16} />
                    <span>Mi Perfil</span>
                  </button>
                </div>
                <div className="border-t border-gray-200 py-2">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            value={searchValue}
            onChange={(e) => handleSearch(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg 
                       bg-gray-50 text-sm placeholder-gray-500
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white"
          />
        </form>
      </div>
    </header>
  );
};

export default TopBar;