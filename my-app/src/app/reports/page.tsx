"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '@/context/AuthContext';
import {
  TrendingUp,
  TrendingDown,
  Package,
  AlertCircle,
  DollarSign,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  RefreshCw,
  Download,
  Tag,
  Building,
  AlertTriangle,
  ShieldAlert,
  Filter,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';

// Interfaces based on API documentation
interface StatusBreakdown {
  status: string;
  count: number;
  total_value?: number;
}

interface CategoryBreakdown {
  category_id: string;
  category_name: string;
  count: number;
  total_value: number;
}

interface SchoolBreakdown {
  school_id: string;
  school_name: string;
  count: number;
  total_value: number;
}

interface TopAsset {
  id: string;
  template_name: string;
  serial_number: string;
  value_estimate: number;
  status: string;
  classroom_id: string;
}

interface DateRange {
  start: string;
  end: string;
  preset: string;
}

interface AssetReport {
  total_assets: number;
  total_value: number;
  by_status: StatusBreakdown[];
  by_category: CategoryBreakdown[];
  by_school: SchoolBreakdown[];
  assets_without_template: number;
  top_valued_assets: TopAsset[];
  date_range: DateRange;
  generated_at: string;
}

interface RecentIncident {
  id: string;
  asset_id: string;
  description: string;
  status: string;
  reported_at: string;
  resolved_at: string | null;
  reported_by: string;
}

interface AssetWithIncidents {
  asset_id: string;
  template_name: string;
  serial_number: string;
  incident_count: number;
}

interface IncidentReport {
  total_incidents: number;
  by_status: StatusBreakdown[];
  average_resolution_hours: number | null;
  unresolved_count: number;
  recent_incidents: RecentIncident[];
  top_assets_with_incidents: AssetWithIncidents[];
  date_range: DateRange;
  generated_at: string;
}

interface ReportsOverview {
  assets: AssetReport;
  incidents: IncidentReport;
  generated_at: string;
}

interface School {
  id: string;
  name: string;
}

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

const presetOptions = [
  { value: 'today', label: 'Hoy' },
  { value: 'week', label: 'Última Semana' },
  { value: 'month', label: 'Último Mes' },
  { value: 'quarter', label: 'Último Trimestre' },
  { value: 'year', label: 'Último Año' },
  { value: 'all_time', label: 'Todo el Tiempo' }
];

const statusColors: Record<string, string> = {
  available: 'bg-green-100 text-green-800',
  in_use: 'bg-blue-100 text-blue-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  retired: 'bg-gray-100 text-gray-800',
  open: 'bg-red-100 text-red-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800'
};

const statusLabels: Record<string, string> = {
  available: 'Disponible',
  in_use: 'En Uso',
  maintenance: 'Mantenimiento',
  retired: 'Retirado',
  open: 'Abierto',
  in_progress: 'En Progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado'
};

const ReportsPage: React.FC = () => {
  const { user, token, isLoading: isAuthLoading } = useAuth();
  const [overview, setOverview] = useState<ReportsOverview | null>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preset, setPreset] = useState<string>('month');
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [useCustomDate, setUseCustomDate] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch schools (only for superusers)
  const fetchSchools = useCallback(async () => {
    if (!user?.is_superuser || !token) return;

    try {
      const response = await axios.get(`${API_BASE_URL}/schools/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      setSchools(response.data);
    } catch (err) {
      console.error('Error fetching schools:', err);
    }
  }, [user?.is_superuser, token]);

  // Fetch reports overview
  const fetchReports = useCallback(async () => {
    if (!token) return;

    setIsLoading(true);
    setError(null);

    try {
      const params: any = {};

      if (useCustomDate && startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      } else if (preset) {
        params.preset = preset;
      }

      if (selectedSchool && user?.is_superuser) {
        params.school_id = selectedSchool;
      }

      const response = await axios.get(`${API_BASE_URL}/reports/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        params
      });

      setOverview(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar reportes');
      console.error('Error fetching reports:', err);
    } finally {
      setIsLoading(false);
    }
  }, [token, preset, selectedSchool, useCustomDate, startDate, endDate, user?.is_superuser]);

  // Export to Excel (simple example)
  const exportReport = async () => {
    if (!overview) return;

    try {
      const dataStr = JSON.stringify(overview, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `reporte-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al exportar reporte');
      console.error('Export error:', err);
    }
  };

  useEffect(() => {
    if (!isAuthLoading && user && token) {
      fetchSchools();
      fetchReports();
    }
  }, [isAuthLoading, user, token, fetchSchools, fetchReports]);

  // Loading auth state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600">Necesitas iniciar sesión para ver esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reportes y Análisis</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Vista integral de activos e incidentes del sistema
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-gray-200 transition-colors"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </button>
                <button
                  onClick={fetchReports}
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Actualizar
                </button>
                {overview && (
                  <button
                    onClick={exportReport}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="space-y-4">
              {/* Preset Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Período de Tiempo
                </label>
                <div className="flex flex-wrap gap-2">
                  {presetOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setPreset(option.value);
                        setUseCustomDate(false);
                      }}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        preset === option.value && !useCustomDate
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Date Range */}
              <div>
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={useCustomDate}
                    onChange={(e) => setUseCustomDate(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Usar rango personalizado
                  </span>
                </label>
                {useCustomDate && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de inicio
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Fecha de fin
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* School Selector (Super Admin only) */}
              {user?.is_superuser && schools.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Escuela
                  </label>
                  <select
                    value={selectedSchool}
                    onChange={(e) => setSelectedSchool(e.target.value)}
                    className="w-full md:w-64 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Todas las escuelas</option>
                    {schools.map(school => (
                      <option key={school.id} value={school.id}>
                        {school.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={fetchReports}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                >
                  Aplicar Filtros
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Generando reportes...</p>
          </div>
        )}

        {/* Reports Content */}
        {!isLoading && overview && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Métricas Clave
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Assets */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Package className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Activos</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {overview.assets.total_assets.toLocaleString()}
                  </p>
                </div>

                {/* Total Value */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Valor Total</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    ${overview.assets.total_value.toLocaleString()}
                  </p>
                </div>

                {/* Total Incidents */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-yellow-100 rounded-lg">
                      <AlertTriangle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Total de Incidentes</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {overview.incidents.total_incidents.toLocaleString()}
                  </p>
                </div>

                {/* Unresolved Incidents */}
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">Incidentes Sin Resolver</h3>
                  <p className="text-3xl font-bold text-gray-900">
                    {overview.incidents.unresolved_count.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Assets Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Análisis de Activos
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assets by Status */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Estado</h3>
                  <div className="space-y-3">
                    {overview.assets.by_status.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                            {statusLabels[item.status] || item.status}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{item.count}</p>
                          {item.total_value !== undefined && (
                            <p className="text-xs text-gray-500">${item.total_value.toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Assets by Category */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Categoría</h3>
                  <div className="space-y-3">
                    {overview.assets.by_category.slice(0, 5).map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center flex-1">
                          <Tag className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{item.category_name}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">{item.count}</p>
                          <p className="text-xs text-gray-500">${item.total_value.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top Valued Assets */}
                {overview.assets.top_valued_assets.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activos de Mayor Valor</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serie</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {overview.assets.top_valued_assets.map((asset, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900">{asset.template_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{asset.serial_number}</td>
                              <td className="px-4 py-3">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[asset.status] || 'bg-gray-100 text-gray-800'}`}>
                                  {statusLabels[asset.status] || asset.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                                ${asset.value_estimate.toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Incidents Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Análisis de Incidentes
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Incidents by Status */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Por Estado</h3>
                  <div className="space-y-3">
                    {overview.incidents.by_status.map((item, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[item.status] || 'bg-gray-100 text-gray-800'}`}>
                          {statusLabels[item.status] || item.status}
                        </span>
                        <p className="text-sm font-semibold text-gray-900">{item.count}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Resolution Metrics */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Métricas de Resolución</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <Clock className="h-5 w-5 text-gray-400 mr-3" />
                        <span className="text-sm text-gray-700">Tiempo Promedio</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {overview.incidents.average_resolution_hours
                          ? `${overview.incidents.average_resolution_hours.toFixed(1)} hrs`
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                        <span className="text-sm text-gray-700">Resueltos</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {overview.incidents.total_incidents - overview.incidents.unresolved_count}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <XCircle className="h-5 w-5 text-red-500 mr-3" />
                        <span className="text-sm text-gray-700">Sin Resolver</span>
                      </div>
                      <span className="text-lg font-semibold text-gray-900">
                        {overview.incidents.unresolved_count}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recent Incidents */}
                {overview.incidents.recent_incidents.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Incidentes Recientes</h3>
                    <div className="space-y-3">
                      {overview.incidents.recent_incidents.slice(0, 5).map((incident, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{incident.description}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                Reportado: {new Date(incident.reported_at).toLocaleString()}
                              </p>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[incident.status] || 'bg-gray-100 text-gray-800'}`}>
                              {statusLabels[incident.status] || incident.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Top Assets with Incidents */}
                {overview.incidents.top_assets_with_incidents.length > 0 && (
                  <div className="bg-white rounded-lg shadow p-6 lg:col-span-2">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Activos con Más Incidentes</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Serie</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Incidentes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {overview.incidents.top_assets_with_incidents.map((asset, index) => (
                            <tr key={index}>
                              <td className="px-4 py-3 text-sm text-gray-900">{asset.template_name}</td>
                              <td className="px-4 py-3 text-sm text-gray-500">{asset.serial_number}</td>
                              <td className="px-4 py-3">
                                <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                                  {asset.incident_count}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Date Range Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <Calendar className="h-5 w-5 text-blue-600 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-blue-800">Período del Reporte</h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {overview.assets.date_range.preset && (
                      <span className="font-semibold">
                        {presetOptions.find(p => p.value === overview.assets.date_range.preset)?.label}:{' '}
                      </span>
                    )}
                    {new Date(overview.assets.date_range.start).toLocaleDateString()} - {new Date(overview.assets.date_range.end).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Generado: {new Date(overview.generated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportsPage;
