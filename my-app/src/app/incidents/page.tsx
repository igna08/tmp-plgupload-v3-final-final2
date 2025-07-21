"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit3, 
  Trash2,
  AlertTriangle,
  Search,
  MoreHorizontal,
  AlertCircle,
  Loader2,
  Shield,
  Calendar,
  FileText,
  X,
  Clock,
  CheckCircle,
  Camera,
  User,
  MapPin,
  Bell,
  Filter,
  RefreshCw
} from 'lucide-react';
import Modal from '@/components/ui/Modal';

// Interfaces
interface Incident {
  id: string;
  description: string;
  photo_url: string | null;
  asset_id: string;
  status: string;
  reported_by: string;
  reported_at: string;
  resolved_at: string | null;
}

interface IncidentWithAsset extends Incident {
  asset?: {
    id: string;
    name: string;
    location?: string;
  };
  reporter?: {
    id: string;
    name: string;
    email: string;
  };
}

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

const IncidentsPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [incidents, setIncidents] = useState<IncidentWithAsset[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<IncidentWithAsset | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(20);
  const [totalIncidents, setTotalIncidents] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [todayIncidents, setTodayIncidents] = useState(0);
  const [newIncidents, setNewIncidents] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const totalPages = Math.ceil(totalIncidents / limit);

  const fetchIncidents = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/incidents/`, {
        params: { skip: page * limit, limit: limit },
      });
      
      // Sort by most recent first
      const sortedIncidents = response.data.sort((a: Incident, b: Incident) => 
        new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime()
      );
      
      setIncidents(sortedIncidents);
      
      // Calculate today's incidents
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayCount = sortedIncidents.filter((incident: Incident) => {
        const incidentDate = new Date(incident.reported_at);
        incidentDate.setHours(0, 0, 0, 0);
        return incidentDate.getTime() === today.getTime();
      }).length;
      
      // Calculate new incidents (last 2 hours)
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const newCount = sortedIncidents.filter((incident: Incident) => 
        new Date(incident.reported_at) > twoHoursAgo
      ).length;
      
      setTodayIncidents(todayCount);
      setNewIncidents(newCount);
      
      if (page === 0 && response.data.length < limit) {
        setTotalIncidents(response.data.length);
      } else if (response.data.length < limit) {
        setTotalIncidents(page * limit + response.data.length);
      } else {
        setTotalIncidents((page + 1) * limit + 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar los incidentes.');
      console.error("Fetch incidents error:", err);
      setIncidents([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!isAuthLoading && user) {
      fetchIncidents(currentPage);
    }
  }, [fetchIncidents, currentPage, user, isAuthLoading]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && incidents.length === limit) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const handleIncidentSelect = (incident: IncidentWithAsset) => {
    setSelectedIncident(incident);
    setIsSidebarOpen(true);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
    setSelectedIncident(null);
  };

  const openDeleteModal = (incident: IncidentWithAsset) => {
    setSelectedIncident(incident);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedIncident(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedIncident) return;
    setIsDeleting(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/incidents/${selectedIncident.id}`);
      fetchIncidents(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al eliminar el incidente.");
      console.error("Delete incident error:", err);
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'open':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
      case 'closed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
      case 'open':
        return <Clock className="h-4 w-4" />;
      case 'resolved':
      case 'closed':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <AlertCircle className="h-4 w-4" />;
    }
  };

  const isNewIncident = (reportedAt: string) => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    return new Date(reportedAt) > twoHoursAgo;
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         incident.asset?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-gray-900 mb-2">Acceso Denegado</h1>
          <p className="text-gray-600">No tienes permisos para ver esta página.</p>
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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Incidentes</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gestiona y supervisa todos los incidentes reportados
                </p>
              </div>
              <div className="flex items-center space-x-4">
                {todayIncidents > 0 && (
                  <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Hoy: {todayIncidents}</span>
                  </div>
                )}
                {newIncidents > 0 && (
                  <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 animate-pulse">
                    <Bell className="h-4 w-4" />
                    <span>Nuevos: {newIncidents}</span>
                  </div>
                )}
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Reportar Incidente</span>
                  <span className="sm:hidden">Reportar</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main Content */}
        <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
          {/* Filters and Search */}
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div className="relative flex-1 max-w-lg">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar incidentes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="resolved">Resuelto</option>
                  </select>
                  <Button
                    onClick={() => fetchIncidents(currentPage)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg flex items-center space-x-1 transition-colors"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Incidents List */}
          {isLoading && incidents.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Cargando incidentes...</p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-white shadow rounded-lg">
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar incidentes</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button
                  onClick={() => fetchIncidents(currentPage)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Intentar nuevamente
                </Button>
              </div>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="bg-white shadow rounded-lg">
              <div className="text-center py-12">
                <AlertTriangle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm ? 'No se encontraron incidentes' : 'No hay incidentes registrados'}
                </h3>
                <p className="text-gray-500 mb-6">
                  {searchTerm 
                    ? 'Intenta con términos de búsqueda diferentes.'
                    : 'Los incidentes aparecerán aquí cuando sean reportados.'
                  }
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="divide-y divide-gray-200">
                {filteredIncidents.map((incident) => (
                  <div 
                    key={incident.id} 
                    className={`p-6 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                      selectedIncident?.id === incident.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => handleIncidentSelect(incident)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-2">
                          {isNewIncident(incident.reported_at) && (
                            <span className="bg-red-500 text-white px-2 py-1 text-xs font-medium rounded-full animate-pulse">
                              NUEVO
                            </span>
                          )}
                          <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                            {getStatusIcon(incident.status)}
                            <span className="ml-1 capitalize">{incident.status || 'Pendiente'}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {formatDate(incident.reported_at)}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-1">
                          {incident.description}
                        </h3>
                        
                        <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-2 sm:space-y-0 text-sm text-gray-500">
                          {incident.asset?.name && (
                            <div className="flex items-center">
                              <FileText className="h-4 w-4 mr-1" />
                              <span>Activo: {incident.asset.name}</span>
                            </div>
                          )}
                          {incident.reporter?.name && (
                            <div className="flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              <span>Reportado por: {incident.reporter.name}</span>
                            </div>
                          )}
                          {incident.photo_url && (
                            <div className="flex items-center">
                              <Camera className="h-4 w-4 mr-1" />
                              <span>Con foto</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIncidentSelect(incident);
                          }}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Ver detalles"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeleteModal(incident);
                          }}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                          title="Eliminar incidente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && incidents.length > 0 && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow mt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Anterior
                  </Button>
                  <Button
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages - 1 || incidents.length < limit}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Siguiente
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando{' '}
                      <span className="font-medium">{currentPage * limit + 1}</span>
                      {' '}a{' '}
                      <span className="font-medium">
                        {Math.min((currentPage + 1) * limit, totalIncidents)}
                      </span>
                      {' '}de{' '}
                      <span className="font-medium">{totalIncidents}</span>
                      {' '}resultados
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <Button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                        Página {currentPage + 1} de {totalPages > 0 ? totalPages : 1}
                      </span>
                      <Button
                        onClick={handleNextPage}
                        disabled={currentPage >= totalPages - 1 || incidents.length < limit}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar for incident details */}
        <div className={`${isSidebarOpen ? 'block' : 'hidden'} lg:block w-full lg:w-96 bg-white shadow-xl border-l border-gray-200 overflow-y-auto`}>
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900">Detalles del Incidente</h2>
              <button
                onClick={closeSidebar}
                className="lg:hidden p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {selectedIncident ? (
              <div className="space-y-6">
                {/* Status Badge */}
                <div className="flex items-center justify-center">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(selectedIncident.status)}`}>
                    {getStatusIcon(selectedIncident.status)}
                    <span className="ml-2 capitalize">{selectedIncident.status || 'Pendiente'}</span>
                  </div>
                  {isNewIncident(selectedIncident.reported_at) && (
                    <span className="ml-2 bg-red-500 text-white px-2 py-1 text-xs font-medium rounded-full animate-pulse">
                      NUEVO
                    </span>
                  )}
                </div>

                {/* Photo */}
                {selectedIncident.photo_url && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Foto del Incidente</h3>
                    <img 
                      src={selectedIncident.photo_url} 
                      alt="Incidente"
                      className="w-full h-48 object-cover rounded-lg border border-gray-200"
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Descripción</h3>
                  <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedIncident.description}
                  </p>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Cronología</h3>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-red-100 flex items-center justify-center">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">Incidente Reportado</p>
                        <p className="text-sm text-gray-500">{formatDate(selectedIncident.reported_at)}</p>
                      </div>
                    </div>
                    
                    {selectedIncident.resolved_at && (
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">Incidente Resuelto</p>
                          <p className="text-sm text-gray-500">{formatDate(selectedIncident.resolved_at)}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Asset Info */}
                {selectedIncident.asset && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Activo Afectado</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{selectedIncident.asset.name}</p>
                      {selectedIncident.asset.location && (
                        <div className="flex items-center mt-1">
                          <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                          <p className="text-sm text-gray-500">{selectedIncident.asset.location}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Reporter Info */}
                {selectedIncident.reporter && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-2">Reportado por</h3>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-gray-900">{selectedIncident.reporter.name}</p>
                      <p className="text-sm text-gray-500">{selectedIncident.reporter.email}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex space-x-3">
                    <Button
                      onClick={() => openDeleteModal(selectedIncident)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Selecciona un incidente para ver sus detalles</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {selectedIncident && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          title="Confirmar Eliminación"
          size="small"
          footer={
            <>
            <Button variant="secondary" onClick={closeDeleteModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="ml-3"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Eliminando...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </>
              )}
            </Button>
          </>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  ¿Estás seguro de que deseas eliminar este incidente?
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Esta acción no se puede deshacer.
                </p>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Detalles del incidente:</h4>
              <p className="text-sm text-gray-700 mb-2">
                <strong>Descripción:</strong> {selectedIncident.description}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Reportado:</strong> {formatDate(selectedIncident.reported_at)}
              </p>
            </div>
          </div>
        </Modal>
      )}


      
    </div>
  );
};

export default IncidentsPage;