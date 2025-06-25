"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit3, 
  Trash2,
  Building,
  MapPin,
  Users,
  Home,
  Search,
  Filter,
  MoreHorizontal,
  AlertCircle,
  Loader2
} from 'lucide-react';
import CreateSchoolModal from '@/components/schools/CreateSchoolModal';

// Define the School interface based on API response
interface School {
  id: string;
  name: string;
  address: string;
  description: string | null;
  logo_url: string | null;
  // Add any other fields that might come from the API and are useful
}

const API_BASE_URL = 'http://localhost:8000/api';

const SchoolsPage: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(12); // Items per page - increased for better grid layout
  const [totalSchools, setTotalSchools] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const totalPages = Math.ceil(totalSchools / limit);

  const fetchSchools = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/schools/`, {
        params: { skip: page * limit, limit: limit },
      });
      setSchools(response.data);

      if (page === 0 && response.data.length < limit) {
        setTotalSchools(response.data.length);
      } else if (response.data.length < limit) {
        setTotalSchools(page * limit + response.data.length);
      } else {
        setTotalSchools((page + 1) * limit + 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch schools. Ensure you are logged in and the API is running.');
      console.error("Fetch schools error:", err);
      setSchools([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSchools(currentPage);
  }, [fetchSchools, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && schools.length === limit) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const openCreateModal = () => setIsCreateModalOpen(true);
  const closeCreateModal = () => setIsCreateModalOpen(false);

  const handleSchoolCreated = () => {
    fetchSchools(currentPage);
  };

  const filteredSchools = schools.filter(school =>
    school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    school.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading && schools.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando escuelas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar escuelas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchSchools(currentPage)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Intentar nuevamente
          </button>
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Escuelas</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gestiona y administra todas las escuelas del sistema
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {schools.length} {schools.length === 1 ? 'Escuela' : 'Escuelas'}
                </div>
                <Button
                  onClick={openCreateModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Escuela</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
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
                  placeholder="Buscar escuelas por nombre o dirección..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Grid
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      viewMode === 'list'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Lista
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {isLoading && schools.length === 0 ? null : filteredSchools.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="text-center py-12">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm ? 'No se encontraron escuelas' : 'No hay escuelas registradas'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm 
                  ? 'Intenta con términos de búsqueda diferentes.'
                  : 'Comienza creando tu primera escuela para el sistema.'
                }
              </p>
              {!searchTerm && (
                <Button
                  onClick={openCreateModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear Primera Escuela</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredSchools.map((school) => (
                  <div key={school.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="flex-shrink-0">
                          {school.logo_url ? (
                            <img 
                              className="h-12 w-12 rounded-full object-cover" 
                              src={school.logo_url} 
                              alt={school.name}
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                              <Building className="h-6 w-6 text-blue-600" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-lg font-medium text-gray-900 truncate">{school.name}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span className="truncate">{school.address}</span>
                          </div>
                        </div>
                      </div>
                      
                      {school.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{school.description}</p>
                      )}
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => alert(`Ver detalles de ${school.name}`)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => alert(`Editar ${school.name}`)}
                            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                            title="Editar escuela"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => alert(`Eliminar ${school.name}`)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar escuela"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                        <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-white shadow rounded-lg overflow-hidden">
                <div className="min-w-full divide-y divide-gray-200">
                  <div className="bg-gray-50 px-6 py-3">
                    <div className="flex items-center">
                      <div className="w-12"></div>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Escuela
                        </div>
                        <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Dirección
                        </div>
                        <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Descripción
                        </div>
                      </div>
                      <div className="w-24 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </div>
                    </div>
                  </div>
                  <div className="bg-white divide-y divide-gray-200">
                    {filteredSchools.map((school) => (
                      <div key={school.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          <div className="w-12 flex-shrink-0">
                            {school.logo_url ? (
                              <img 
                                className="h-10 w-10 rounded-full object-cover" 
                                src={school.logo_url} 
                                alt={school.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                <Building className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 ml-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{school.name}</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-900 flex items-center">
                                <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                {school.address}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500 truncate">
                                {school.description || 'Sin descripción'}
                              </div>
                            </div>
                          </div>
                          <div className="w-24 flex justify-end space-x-2">
                            <button
                              onClick={() => alert(`Ver detalles de ${school.name}`)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => alert(`Editar ${school.name}`)}
                              className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                              title="Editar escuela"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => alert(`Eliminar ${school.name}`)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar escuela"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Pagination */}
        {!isLoading && schools.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg shadow mt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 0}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </Button>
                <Button
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1 || schools.length < limit}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      {Math.min((currentPage + 1) * limit, totalSchools)}
                    </span>
                    {' '}de{' '}
                    <span className="font-medium">{totalSchools}</span>
                    {' '}resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button
                      onClick={handlePreviousPage}
                      disabled={currentPage === 0}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
                      Página {currentPage + 1} de {totalPages > 0 ? totalPages : 1}
                    </span>
                    <Button
                      onClick={handleNextPage}
                      disabled={currentPage >= totalPages - 1 || schools.length < limit}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* Modal */}
      <CreateSchoolModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSchoolUpdated={handleSchoolCreated}
        mode="create"
      />
    </div>
  );
};

export default SchoolsPage;