"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext';
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  Edit3, 
  Trash2,
  FileText,
  Search,
  Filter,
  MoreHorizontal,
  AlertCircle,
  Loader2,
  Shield,
  Calendar,
  Package,
  Building2,
  Hash
} from 'lucide-react';
import CreateAssetTemplateModal from '@/components/assets/templates/CreateAssetTemplateModal';
import EditAssetTemplateModal from '@/components/assets/templates/EditAssetTemplateModal';
import Modal from '@/components/ui/Modal';

// Interfaces
interface AssetCategory {
  id: string;
  name: string;
}

interface AssetTemplate {
  id: string;
  name: string;
  description: string | null;
  manufacturer: string | null;
  model_number: string | null;
  category_id: string;
  created_at: string;
  updated_at: string;
  category: {
    id: string;
    name: string;
  };
}

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

const AssetTemplatesPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [templates, setTemplates] = useState<AssetTemplate[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(12);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AssetTemplate | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const totalPages = Math.ceil(totalItems / limit);

  // Fetch Asset Categories
  useEffect(() => {
    const fetchAllCategories = async () => {
      if (!user?.is_superuser) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/assets/categories/?limit=1000`);
        setCategories(response.data || []);
      } catch (err) {
        console.error("Failed to fetch categories for filter:", err);
      }
    };
    if (!isAuthLoading && user?.is_superuser) {
        fetchAllCategories();
    }
  }, [user, isAuthLoading]);

  // Fetch Asset Templates
  const fetchTemplates = useCallback(async (page: number, categoryId: string | null) => {
    setIsLoading(true);
    setError(null);
    try {
      let response;
      const params = { skip: page * limit, limit: limit };
      if (categoryId) {
        response = await axios.get(`${API_BASE_URL}/assets/templates/by_category/${categoryId}`, { params });
      } else {
        response = await axios.get(`${API_BASE_URL}/assets/templates/`, { params });
      }

      setTemplates(response.data || []);
      const fetchedCount = response.data?.length || 0;
      if (page === 0 && fetchedCount < limit) {
        setTotalItems(fetchedCount);
      } else if (fetchedCount < limit) {
        setTotalItems(page * limit + fetchedCount);
      } else {
        setTotalItems((page + 1) * limit + 1);
      }

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar las plantillas de activos. Asegúrate de estar autenticado.');
      console.error("Fetch asset templates error:", err);
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!isAuthLoading && user?.is_superuser) {
      fetchTemplates(currentPage, selectedCategoryId);
    }
  }, [fetchTemplates, currentPage, selectedCategoryId, user, isAuthLoading]);

  const handleCategoryFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const categoryId = e.target.value;
    setSelectedCategoryId(categoryId === "all" ? null : categoryId);
    setCurrentPage(0);
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && templates.length === limit) {
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

  const handleTemplateCreated = () => {
    fetchTemplates(currentPage, selectedCategoryId);
  };

  const openEditModal = (template: AssetTemplate) => {
    setSelectedTemplate(template);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedTemplate(null);
    setIsEditModalOpen(false);
  };
  const handleTemplateUpdated = () => {
    fetchTemplates(currentPage, selectedCategoryId);
  };

  const openDeleteModal = (template: AssetTemplate) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setSelectedTemplate(null);
    setIsDeleteModalOpen(false);
  };
  const handleConfirmDelete = async () => {
    if (!selectedTemplate) return;
    setIsDeleting(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/assets/templates/${selectedTemplate.id}`);
      fetchTemplates(currentPage, selectedCategoryId);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al eliminar la plantilla de activo.");
      console.error("Delete asset template error:", err);
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  const handleViewTemplate = (template: AssetTemplate) => 
    alert(`Ver detalles de ${template.name} (por implementar)`);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit', 
        minute: '2-digit'
    });
  };

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description && template.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (template.manufacturer && template.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (template.model_number && template.model_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    template.category?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categoryOptions = [{ value: "all", label: "Todas las Categorías" }].concat(
    categories.map(cat => ({ value: cat.id, label: cat.name }))
  );

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando acceso de administrador...</p>
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

  if (isLoading && templates.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando plantillas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar plantillas</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => fetchTemplates(currentPage, selectedCategoryId)}
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
                <h1 className="text-3xl font-bold text-gray-900">Plantillas de Activos</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gestiona y administra todas las plantillas de activos del sistema
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                  {templates.length} {templates.length === 1 ? 'Plantilla' : 'Plantillas'}
                </div>
                <Button
                  onClick={openCreateModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Plantilla</span>
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
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-lg">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Buscar plantillas por nombre, descripción, fabricante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                <div className="flex items-center space-x-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <select
                    value={selectedCategoryId || "all"}
                    onChange={handleCategoryFilterChange}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500 min-w-[180px]"
                  >
                    {categoryOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
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
        {isLoading && templates.length === 0 ? null : filteredTemplates.length === 0 ? (
          <div className="bg-white shadow rounded-lg">
            <div className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchTerm || selectedCategoryId ? 'No se encontraron plantillas' : 'No hay plantillas registradas'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedCategoryId
                  ? 'Intenta con términos de búsqueda diferentes o cambia el filtro de categoría.'
                  : 'Comienza creando tu primera plantilla de activos.'
                }
              </p>
              {!searchTerm && !selectedCategoryId && (
                <Button
                  onClick={openCreateModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Crear Primera Plantilla</span>
                </Button>
              )}
            </div>
          </div>
        ) : (
          <>
            {viewMode === 'grid' ? (
              /* Grid View */
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filteredTemplates.map((template) => (
                  <div key={template.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-lg transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center mb-4">
                        <div className="flex-shrink-0">
                          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                            <FileText className="h-6 w-6 text-green-600" />
                          </div>
                        </div>
                        <div className="ml-4 flex-1">
                          <h3 className="text-lg font-medium text-gray-900 truncate">{template.name}</h3>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Package className="h-4 w-4 mr-1" />
                            <span>{template.category?.name || 'Sin categoría'}</span>
                          </div>
                        </div>
                      </div>
                      
                      {template.description && (
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">{template.description}</p>
                      )}

                      <div className="space-y-2 mb-4">
                        {template.manufacturer && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Building2 className="h-3 w-3 mr-2" />
                            <span className="truncate">{template.manufacturer}</span>
                          </div>
                        )}
                        {template.model_number && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Hash className="h-3 w-3 mr-2" />
                            <span className="truncate">{template.model_number}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center text-xs text-gray-500 mb-4">
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>Creado: {formatDate(template.created_at)}</span>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewTemplate(template)}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(template)}
                            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                            title="Editar plantilla"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(template)}
                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                            title="Eliminar plantilla"
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
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                        <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Plantilla
                        </div>
                        <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Categoría
                        </div>
                        <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Fabricante
                        </div>
                        <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Modelo
                        </div>
                        <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Creado
                        </div>
                        <div className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actualizado
                        </div>
                      </div>
                      <div className="w-24 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </div>
                    </div>
                  </div>
                  <div className="bg-white divide-y divide-gray-200">
                    {filteredTemplates.map((template) => (
                      <div key={template.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center">
                          <div className="w-12 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <FileText className="h-5 w-5 text-green-600" />
                            </div>
                          </div>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4 ml-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{template.name}</div>
                              {template.description && (
                                <div className="text-xs text-gray-500 truncate">{template.description}</div>
                              )}
                            </div>
                            <div>
                              <div className="text-sm text-gray-900">
                                {template.category?.name || 'Sin categoría'}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-900">
                                {template.manufacturer || 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-900">
                                {template.model_number || 'N/A'}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">
                                {formatDate(template.created_at)}
                              </div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">
                                {formatDate(template.updated_at)}
                              </div>
                            </div>
                          </div>
                          <div className="w-24 flex justify-end space-x-2">
                            <button
                              onClick={() => handleViewTemplate(template)}
                              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(template)}
                              className="p-1 text-gray-400 hover:text-yellow-600 transition-colors"
                              title="Editar plantilla"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => openDeleteModal(template)}
                              className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                              title="Eliminar plantilla"
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
        {!isLoading && templates.length > 0 && (
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
                  disabled={currentPage >= totalPages - 1 || templates.length < limit}
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
                      {Math.min((currentPage + 1) * limit, totalItems)}
                    </span>
                    {' '}de{' '}
                    <span className="font-medium">{totalItems}</span>
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
                      disabled={currentPage >= totalPages - 1 || templates.length < limit}
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

      {/* Modals */}
      <CreateAssetTemplateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onTemplateCreated={handleTemplateCreated}
        categories={categories}
      />

      {selectedTemplate && (
        <EditAssetTemplateModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          template={selectedTemplate}
          onTemplateUpdated={handleTemplateUpdated}
          categories={categories}
        />
      )}

      {selectedTemplate && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          title="Confirmar Eliminación"
          size="small"
          footer={
            <>
              <Button variant="secondary" onClick={closeDeleteModal} disabled={isDeleting}>
                Cancelar
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Eliminando...' : 'Eliminar Plantilla'}
              </Button>
            </>
          }
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-900">
                ¿Estás seguro de que quieres eliminar la plantilla <span className="font-semibold">{selectedTemplate.name}</span>?
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Esta acción no se puede deshacer.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssetTemplatesPage;
