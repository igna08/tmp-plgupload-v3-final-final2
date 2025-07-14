"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ShieldAlert,
  Building,
  Package,
  AlertCircle,
  Loader2,
  Search,
  Filter,
  Download,
  QrCode,
  Edit,
  Trash2,
  Plus,
  X,
  Calendar,
  DollarSign,
  ImageIcon,
  Users,
  Tag,
  RefreshCw,
  FileText,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

// Interfaces
interface AssetCategory {
  id: string;
  name: string;
}

interface AssetTemplate {
  id: string;
  name: string;
  description: string;
  manufacturer: string;
  model_number: string;
  category_id: string;
  category: AssetCategory;
}

interface QRCode {
  asset_id: string;
  id: string;
  qr_url: string;
  payload: Record<string, any>;
}

interface Asset {
  id: string;
  template_id: string;
  serial_number: string;
  purchase_date: string;
  value_estimate: number;
  image_url: string;
  status: 'available' | 'in_use' | 'maintenance' | 'retired';
  classroom_id: string;
  created_at: string;
  updated_at: string;
  template: AssetTemplate;
  qr_code?: QRCode;
}

interface AssetEvent {
  id: string;
  asset_id: string;
  user_id: string;
  event_type: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface Filters {
  search: string;
  category: string;
  status: string;
  classroom: string;
  dateFrom: string;
  dateTo: string;
  valueMin: string;
  valueMax: string;
}

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

const statusOptions = [
  { value: 'available', label: 'Disponible', color: 'bg-green-100 text-green-800' },
  { value: 'in_use', label: 'En Uso', color: 'bg-blue-100 text-blue-800' },
  { value: 'maintenance', label: 'Mantenimiento', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'retired', label: 'Retirado', color: 'bg-gray-100 text-gray-800' },
];

const AllAssetsAdminPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [classrooms, setClassrooms] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(20);
  const [totalAssets, setTotalAssets] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [assetEvents, setAssetEvents] = useState<AssetEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    status: '',
    classroom: '',
    dateFrom: '',
    dateTo: '',
    valueMin: '',
    valueMax: '',
  });

  const totalPages = Math.max(1, Math.ceil(totalAssets / limit));

  // Fetch categories
  const fetchCategories = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/assets/categories/`);
      setCategories(response.data);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  }, []);

  // Fetch classrooms
  const fetchClassrooms = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/classrooms/`);
      setClassrooms(response.data);
    } catch (err) {
      console.error("Error fetching classrooms:", err);
    }
  }, []);

  // Fetch assets with filters
  const fetchAssets = useCallback(async (page: number, currentFilters: Filters) => {
    if (!user?.is_superuser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const params: any = {
        skip: page * limit,
        limit: limit + 1,
      };

      // Apply filters
      if (currentFilters.search) params.search = currentFilters.search;
      if (currentFilters.category) params.category_id = currentFilters.category;
      if (currentFilters.status) params.status = currentFilters.status;
      if (currentFilters.classroom) params.classroom_id = currentFilters.classroom;
      if (currentFilters.dateFrom) params.date_from = currentFilters.dateFrom;
      if (currentFilters.dateTo) params.date_to = currentFilters.dateTo;
      if (currentFilters.valueMin) params.value_min = parseFloat(currentFilters.valueMin);
      if (currentFilters.valueMax) params.value_max = parseFloat(currentFilters.valueMax);

      const response = await axios.get(`${API_BASE_URL}/assets/`, { params });
      
      const data = response.data;
      const hasMore = data.length > limit;
      
      if (hasMore) {
        setAssets(data.slice(0, limit));
        setHasNextPage(true);
      } else {
        setAssets(data);
        setHasNextPage(false);
      }
      
      if (page === 0) {
        if (hasMore) {
          setTotalAssets(limit + 1);
        } else {
          setTotalAssets(data.length);
        }
      }
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los activos. Verifica tu conexión y permisos.');
      console.error("Fetch assets error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit, user?.is_superuser]);

  // Fetch asset events
  const fetchAssetEvents = useCallback(async (assetId: string) => {
    setLoadingEvents(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/assets/${assetId}/events/`);
      setAssetEvents(response.data);
    } catch (err) {
      console.error("Error fetching asset events:", err);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  // Generate QR Code
  const generateQRCode = async (assetId: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/assets/${assetId}/qr-codes/`);
      
      // Update the asset with the new QR code
      setAssets(prev => prev.map(asset => 
        asset.id === assetId 
          ? { ...asset, qr_code: response.data }
          : asset
      ));
      
      if (selectedAsset?.id === assetId) {
        setSelectedAsset(prev => prev ? { ...prev, qr_code: response.data } : null);
      }
      
      alert('Código QR generado exitosamente');
    } catch (err: any) {
      alert('Error al generar código QR: ' + (err.response?.data?.detail || 'Error desconocido'));
    }
  };

  // Export to Excel
  const exportToExcel = async () => {
    setIsExporting(true);
    try {
      // Fetch all assets without pagination for export
      const response = await axios.get(`${API_BASE_URL}/assets/`, {
        params: { skip: 0, limit: 10000, ...filters }
      });
      
      const exportData = response.data.map((asset: Asset) => ({
        'ID': asset.id,
        'Nombre': asset.template.name,
        'Número de Serie': asset.serial_number,
        'Categoría': asset.template.category.name,
        'Fabricante': asset.template.manufacturer,
        'Modelo': asset.template.model_number,
        'Estado': statusOptions.find(s => s.value === asset.status)?.label || asset.status,
        'Fecha de Compra': asset.purchase_date,
        'Valor Estimado': asset.value_estimate,
        'Aula': asset.classroom_id,
        'Fecha de Creación': new Date(asset.created_at).toLocaleDateString(),
        'Última Actualización': new Date(asset.updated_at).toLocaleDateString(),
        'Descripción': asset.template.description,
        'URL de Imagen': asset.image_url,
        'QR Code URL': asset.qr_code?.qr_url || '',
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Activos');
      
      const fileName = `activos_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
    } catch (err) {
      alert('Error al exportar datos');
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Event handlers
  const handleFilterChange = (key: keyof Filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    setCurrentPage(0);
    fetchAssets(0, filters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      status: '',
      classroom: '',
      dateFrom: '',
      dateTo: '',
      valueMin: '',
      valueMax: '',
    };
    setFilters(clearedFilters);
    setCurrentPage(0);
    fetchAssets(0, clearedFilters);
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      fetchAssets(nextPage, filters);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      const prevPage = currentPage - 1;
      setCurrentPage(prevPage);
      fetchAssets(prevPage, filters);
    }
  };

  const openAssetModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setShowAssetModal(true);
    fetchAssetEvents(asset.id);
  };

  const closeAssetModal = () => {
    setShowAssetModal(false);
    setSelectedAsset(null);
    setAssetEvents([]);
  };

  const retryFetch = () => {
    fetchAssets(currentPage, filters);
  };

  useEffect(() => {
    if (!isAuthLoading && user?.is_superuser) {
      fetchAssets(currentPage, filters);
      fetchCategories();
      fetchClassrooms();
    }
  }, [user?.is_superuser, isAuthLoading, fetchAssets, fetchCategories, fetchClassrooms]);

  // Loading auth state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  // Access denied
  if (!user?.is_superuser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600">No tienes permisos para ver esta página. Se requieren privilegios de administrador.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-900">Todos los Activos (Vista Admin)</h1>
              <p className="mt-1 text-sm text-gray-500">Gestión centralizada de activos del sistema</p>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md mx-auto">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={retryFetch}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Intentar nuevamente
            </button>
          </div>
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
                <h1 className="text-3xl font-bold text-gray-900">Todos los Activos (Vista Admin)</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gestión centralizada de activos del sistema
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Package className="h-4 w-4 mr-1" />
                  {assets.length} activos cargados
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium flex items-center hover:bg-gray-200 transition-colors"
                >
                  <Filter className="h-4 w-4 mr-1" />
                  Filtros
                </button>
                <button
                  onClick={exportToExcel}
                  disabled={isExporting}
                  className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium flex items-center hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isExporting ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 mr-1" />
                  )}
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border-b shadow-sm">
          <div className="px-4 sm:px-6 lg:px-8 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Nombre, serie, etc."
                    className="pl-10 w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Todas las categorías</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aula</label>
                <select
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.classroom}
                  onChange={(e) => handleFilterChange('classroom', e.target.value)}
                >
                  <option value="">Todas las aulas</option>
                  {classrooms.map(classroom => (
                    <option key={classroom.id} value={classroom.id}>{classroom.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha desde</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha hasta</label>
                <input
                  type="date"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor mínimo</label>
                <input
                  type="number"
                  placeholder="$0"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.valueMin}
                  onChange={(e) => handleFilterChange('valueMin', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor máximo</label>
                <input
                  type="number"
                  placeholder="$999999"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={filters.valueMax}
                  onChange={(e) => handleFilterChange('valueMax', e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end space-x-3">
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Limpiar
              </button>
              <button
                onClick={applyFilters}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando activos...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && assets.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron activos</h3>
            <p className="text-gray-500">No hay activos registrados con los filtros aplicados.</p>
          </div>
        )}

        {/* Assets Table */}
        {!isLoading && assets.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Activo
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aula
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      QR Code
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {assets.map((asset, index) => (
                    <tr key={asset.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            {asset.image_url ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={asset.image_url} 
                                alt={asset.template.name}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                }}
                              />
                            ) : null}
                            <div className={`h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center ${asset.image_url ? 'hidden' : ''}`}>
                              <Package className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{asset.template.name}</div>
                            <div className="text-sm text-gray-500">Serie: {asset.serial_number}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">{asset.template.category.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusOptions.find(s => s.value === asset.status)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {statusOptions.find(s => s.value === asset.status)?.label || asset.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                          <span className="text-sm text-gray-900">
                            ${asset.value_estimate.toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 text-gray-400 mr-2" />
                          <Link 
                            href={`/classrooms/${asset.classroom_id}`}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                          >
                            Ver aula
                          </Link>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          {asset.qr_code ? (
                            <a
                              href={asset.qr_code.qr_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-green-600 hover:text-green-800 p-1 rounded"
                            >
                              <QrCode className="h-4 w-4" />
                            </a>
                          ) : (
                            <button
                              onClick={() => generateQRCode(asset.id)}
                              className="text-gray-400 hover:text-gray-600 p-1 rounded"
                              title="Generar QR"
                            >
                              <QrCode className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => generateQRCode(asset.id)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Regenerar QR"
                          >
                            <RefreshCw className="h-3 w-3" />
                          </button>
                          </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openAssetModal(asset)}
                            className="text-blue-600 hover:text-blue-800 p-1 rounded"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/assets/${asset.id}/edit`}
                            className="text-green-600 hover:text-green-800 p-1 rounded"
                            title="Editar"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => {
                              if (confirm('¿Estás seguro de que quieres eliminar este activo?')) {
                                // Aquí iría la función de eliminación
                                console.log('Eliminar activo:', asset.id);
                              }
                            }}
                            className="text-red-600 hover:text-red-800 p-1 rounded"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && assets.length > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center text-sm text-gray-500">
              <span>
                Mostrando {currentPage * limit + 1} a {Math.min((currentPage + 1) * limit, currentPage * limit + assets.length)} de {totalAssets} activos
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 0}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Anterior
              </button>
              <span className="px-3 py-2 text-sm font-medium text-gray-700">
                Página {currentPage + 1} de {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={!hasNextPage}
                className="flex items-center px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
                <ChevronRight className="h-4 w-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Asset Detail Modal */}
      {showAssetModal && selectedAsset && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-screen overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detalles del Activo</h2>
                <button
                  onClick={closeAssetModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Asset Information */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información General</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Nombre:</span>
                        <p className="text-sm text-gray-900">{selectedAsset.template.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Número de Serie:</span>
                        <p className="text-sm text-gray-900">{selectedAsset.serial_number}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Categoría:</span>
                        <p className="text-sm text-gray-900">{selectedAsset.template.category.name}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Fabricante:</span>
                        <p className="text-sm text-gray-900">{selectedAsset.template.manufacturer}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Modelo:</span>
                        <p className="text-sm text-gray-900">{selectedAsset.template.model_number}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Estado:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          statusOptions.find(s => s.value === selectedAsset.status)?.color || 'bg-gray-100 text-gray-800'
                        }`}>
                          {statusOptions.find(s => s.value === selectedAsset.status)?.label || selectedAsset.status}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Información Financiera</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-500">Valor Estimado:</span>
                        <p className="text-sm text-gray-900">${selectedAsset.value_estimate.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-sm font-medium text-gray-500">Fecha de Compra:</span>
                        <p className="text-sm text-gray-900">{selectedAsset.purchase_date}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Ubicación</h3>
                    <div>
                      <span className="text-sm font-medium text-gray-500">Aula:</span>
                      <p className="text-sm text-gray-900">{selectedAsset.classroom_id}</p>
                    </div>
                  </div>
                </div>

                {/* Image and QR Code */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Imagen del Activo</h3>
                    <div className="flex items-center justify-center bg-white rounded-lg p-4">
                      {selectedAsset.image_url ? (
                        <img
                          src={selectedAsset.image_url}
                          alt={selectedAsset.template.name}
                          className="max-w-full max-h-64 object-contain rounded-lg"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null}
                      <div className={`text-center ${selectedAsset.image_url ? 'hidden' : ''}`}>
                        <ImageIcon className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No hay imagen disponible</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Código QR</h3>
                    <div className="flex items-center justify-center bg-white rounded-lg p-4">
                      {selectedAsset.qr_code ? (
                        <div className="text-center">
                          <img
                            src={selectedAsset.qr_code.qr_url}
                            alt="QR Code"
                            className="w-32 h-32 mx-auto mb-2"
                          />
                          <p className="text-xs text-gray-500">QR Code generado</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <QrCode className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-500 mb-2">No hay código QR generado</p>
                          <button
                            onClick={() => generateQRCode(selectedAsset.id)}
                            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
                          >
                            Generar QR
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Asset Events History */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Historial de Eventos</h3>
                {loadingEvents ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                    <span className="ml-2 text-sm text-gray-500">Cargando historial...</span>
                  </div>
                ) : assetEvents.length > 0 ? (
                  <div className="space-y-3 max-h-64 overflow-y-auto">
                    {assetEvents.map((event) => (
                      <div key={event.id} className="bg-white rounded-lg p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{event.event_type}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                          <div className="text-xs text-gray-600">
                            {JSON.stringify(event.metadata, null, 2)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No hay eventos registrados</p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={closeAssetModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cerrar
                </button>
                <Link
                  href={`/assets/${selectedAsset.id}/edit`}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Editar Activo
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllAssetsAdminPage;