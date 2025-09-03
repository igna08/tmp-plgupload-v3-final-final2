"use client";

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Users, 
  School, 
  Laptop, 
  AlertTriangle, 
  TrendingUp, 
  Activity, 
  Package,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Building,
  Home
} from 'lucide-react';

// Define interfaces based on your API response
interface User {
  id: string;
  full_name: string;
  email: string;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  assigned_roles: Array<{
    role_name: string;
    school_name: string;
  }>;
}

interface School {
  name: string;
  address: string;
  description: string;
  logo_url: string;
  id: string;
}

interface Classroom {
  name: string;
  capacity: number;
  id: string;
  school_id: string;
}

interface AssetTemplate {
  name: string;
  description: string;
  manufacturer: string;
  model_number: string;
  category_id: string;
  id: string;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
  };
}

interface Asset {
  template_id: string;
  serial_number: string;
  purchase_date: string;
  value_estimate: number;
  image_url: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  id: string;
  classroom_id: string;
  created_at: string;
  updated_at: string;
  template: {
    name: string;
    description: string;
    manufacturer: string;
    model_number: string;
    category_id: string;
    id: string;
    created_at: string;
    updated_at: string;
    category: {
      id: string;
      name: string;
    };
  };
  qr_code: {
    asset_id: string;
    id: string;
    qr_url: string;
    payload: any;
  };
}

interface Incident {
  description: string;
  photo_url: string;
  id: string;
  asset_id: string;
  status: string;
  reported_by: string;
  reported_at: string;
  resolved_at: string;
}

interface DashboardData {
  users: User[];
  schools: School[];
  classrooms: Classroom[];
  asset_templates: AssetTemplate[];
  assets: Asset[];
  incidents: Incident[];
}

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

export const metadata = {
  title: "ISSA - Sistema de Gestión de QR Escolar",
  description: "Plataforma de gestión de QR para instituciones educativas.",
  openGraph: {
    title: "ISSA - Sistema de Gestión de QR Escolar",
    description: "Plataforma de gestión de QR para instituciones educativas.",
    url: "https://issa-qr.vercel.app",
    siteName: "ISSA QR",
    images: [
      {
        url: "https://issa-qr.vercel.app/foto.png",
        width: 1200,
        height: 630,
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ISSA - Sistema de Gestión de QR Escolar",
    description: "Plataforma de gestión de QR para instituciones educativas.",
    images: ["https://issa-qr.vercel.app/foto.png"],
  },
};



const ModernDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/dashboard/`);
      setDashboardData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch dashboard data. Ensure you are logged in and the API is running.');
      console.error("Fetch dashboard error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Calculate statistics
  const getStats = () => {
    if (!dashboardData) return null;

    const totalAssetValue = dashboardData.assets.reduce((sum, asset) => sum + asset.value_estimate, 0);
    const activeUsers = dashboardData.users.filter(user => user.status === 'active').length;
    const pendingUsers = dashboardData.users.filter(user => user.status === 'pending').length;
    const availableAssets = dashboardData.assets.filter(asset => asset.status === 'available').length;
    const assetsInUse = dashboardData.assets.filter(asset => asset.status === 'in_use').length;
    const assetsInMaintenance = dashboardData.assets.filter(asset => asset.status === 'maintenance').length;
    const openIncidents = dashboardData.incidents.filter(incident => incident.status === 'open' || !incident.resolved_at).length;
    const totalClassroomCapacity = dashboardData.classrooms.reduce((sum, classroom) => sum + classroom.capacity, 0);

    return {
      totalAssetValue,
      activeUsers,
      pendingUsers,
      availableAssets,
      assetsInUse,
      assetsInMaintenance,
      openIncidents,
      totalClassroomCapacity
    };
  };

  const stats = getStats();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('es-AR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(new Date(dateString));
  };

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-gray-100 text-gray-800',
      available: 'bg-green-100 text-green-800',
      in_use: 'bg-blue-100 text-blue-800',
      maintenance: 'bg-orange-100 text-orange-800',
      retired: 'bg-red-100 text-red-800',
      open: 'bg-red-100 text-red-800',
      resolved: 'bg-green-100 text-green-800'
    };

    return statusStyles[status as keyof typeof statusStyles] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar nuevamente
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData || !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No hay datos disponibles</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Resumen general del sistema de gestión escolar
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                  Sistema Activo
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Users */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Usuarios Totales</dt>
                    <dd className="text-2xl font-bold text-gray-900">{dashboardData.users.length}</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-medium">{stats.activeUsers} activos</span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="text-yellow-600 font-medium">{stats.pendingUsers} pendientes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Schools */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <School className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Escuelas</dt>
                    <dd className="text-2xl font-bold text-gray-900">{dashboardData.schools.length}</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-blue-600 font-medium">{dashboardData.classrooms.length} aulas</span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="text-gray-600">{stats.totalClassroomCapacity} capacidad</span>
                </div>
              </div>
            </div>
          </div>

          {/* Total Assets */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Laptop className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Activos Totales</dt>
                    <dd className="text-2xl font-bold text-gray-900">{dashboardData.assets.length}</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-medium">{stats.availableAssets} disponibles</span>
                  <span className="text-gray-500 mx-2">•</span>
                  <span className="text-blue-600 font-medium">{stats.assetsInUse} en uso</span>
                </div>
              </div>
            </div>
          </div>

          {/* Asset Value */}
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Valor Total</dt>
                    <dd className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAssetValue)}</dd>
                  </dl>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex items-center text-sm">
                  <span className="text-orange-600 font-medium">{stats.assetsInMaintenance} en mantenimiento</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Recent Assets */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Activos Recientes</h3>
              <a
                href="/assets"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Ver todos
              </a>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {dashboardData.assets.slice(0, 5).map((asset) => (
              <div key={asset.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{asset.template.name}</h4>
                      <p className="text-sm text-gray-500">{asset.serial_number}</p>
                      <p className="text-xs text-gray-400 mt-1">{asset.template.manufacturer} • {formatDate(asset.created_at)}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(asset.status)}`}>
                        {asset.status}
                      </span>
                      <p className="text-sm font-medium text-gray-900 mt-1">{formatCurrency(asset.value_estimate)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Incidents */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Incidentes Recientes</h3>
                <div className="flex items-center space-x-2">
                  {stats.openIncidents > 0 && (
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs font-medium">
                      {stats.openIncidents} abiertos
                    </span>
                  )}
                  <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                    Ver todos
                  </button>
                </div>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {dashboardData.incidents.length > 0 ? (
                dashboardData.incidents.slice(0, 5).map((incident) => (
                  <div key={incident.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900">{incident.description}</h4>
                        <p className="text-xs text-gray-500 mt-1">Reportado: {formatDate(incident.reported_at)}</p>
                        {incident.resolved_at && (
                          <p className="text-xs text-green-600 mt-1">Resuelto: {formatDate(incident.resolved_at)}</p>
                        )}
                      </div>
                      <div className="ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(incident.resolved_at ? 'resolved' : 'open')}`}>
                          {incident.resolved_at ? 'Resuelto' : 'Abierto'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-8 text-center">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No hay incidentes reportados</p>
                </div>
              )}
            </div>
          </div>

          {/* Schools Overview */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Escuelas Registradas</h3>
            </div>
            <div className="divide-y divide-gray-200">
              {dashboardData.schools.map((school) => (
                <div key={school.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      {school.logo_url ? (
                        <img className="h-10 w-10 rounded-full object-cover" src={school.logo_url} alt={school.name} />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <Building className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{school.name}</h4>
                      <p className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {school.address}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset Templates */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Plantillas de Activos</h3>
                <span className="text-sm text-gray-500">{dashboardData.asset_templates.length} plantillas</span>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {dashboardData.asset_templates.slice(0, 5).map((template) => (
                <div key={template.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                      <p className="text-sm text-gray-500">{template.manufacturer} • {template.model_number}</p>
                      <span className="inline-flex items-center mt-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {template.category.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">{formatDate(template.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernDashboard;
