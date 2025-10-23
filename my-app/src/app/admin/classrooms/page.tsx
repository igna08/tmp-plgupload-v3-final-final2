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
  ShieldAlert,
  Building,
  Users,
  AlertCircle,
  Loader2,
  Search,
  Filter
} from 'lucide-react';
import Link from 'next/link';
import CreateClassroomModal from '@/components/classrooms/CreateClassroomModal';
import EditClassroomModal from '@/components/classrooms/EditClassroomModal';
import Modal from '@/components/ui/Modal';

// Interfaces
interface School {
  id: string;
  name: string;
}

interface Classroom {
  id: string;
  name: string;
  capacity: number | null;
  school_id: string;
}

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

const AllClassroomsAdminPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(10);
  const [totalClassrooms, setTotalClassrooms] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalClassrooms / limit));

  // Fetch schools for the dropdown in create modal
  useEffect(() => {
    const fetchSchools = async () => {
      if (!user?.is_superuser) return;
      try {
        const response = await axios.get(`${API_BASE_URL}/schools/`, {
          params: { limit: 1000 }
        });
        setSchools(response.data || []);
      } catch (err) {
        console.error("Failed to fetch schools:", err);
      }
    };

    if (!isAuthLoading && user?.is_superuser) {
      fetchSchools();
    }
  }, [user, isAuthLoading]);

  const fetchAllClassrooms = useCallback(async (page: number) => {
    if (!user?.is_superuser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/classrooms/`, {
        params: { skip: page * limit, limit: limit + 1 },
      });
      
      const data = response.data;
      const hasMore = data.length > limit;
      
      if (hasMore) {
        setClassrooms(data.slice(0, limit));
        setHasNextPage(true);
      } else {
        setClassrooms(data);
        setHasNextPage(false);
      }
      
      if (page === 0) {
        if (hasMore) {
          setTotalClassrooms(limit + 1);
        } else {
          setTotalClassrooms(data.length);
        }
      }
      
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar las aulas. Verifica tu conexión y permisos.');
      console.error("Fetch classrooms error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit, user?.is_superuser]);

  useEffect(() => {
    if (!isAuthLoading && user?.is_superuser) {
      fetchAllClassrooms(currentPage);
    }
  }, [currentPage, user?.is_superuser, isAuthLoading, fetchAllClassrooms]);

  const handleNextPage = () => {
    if (hasNextPage) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const retryFetch = () => {
    fetchAllClassrooms(currentPage);
  };

  // Create Modal handlers
  const openCreateModal = () => {
    if (schools.length === 0) {
      setError("No hay escuelas disponibles. Por favor, crea una escuela primero.");
      return;
    }
    setSelectedSchoolId(schools[0]?.id || '');
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setSelectedSchoolId('');
  };

  const handleClassroomCreated = () => {
    fetchAllClassrooms(currentPage);
  };

  // Edit Modal handlers
  const openEditModal = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setSelectedClassroom(null);
    setIsEditModalOpen(false);
  };

  const handleClassroomUpdated = () => {
    fetchAllClassrooms(currentPage);
  };

  // Delete Modal handlers
  const openDeleteModal = (classroom: Classroom) => {
    setSelectedClassroom(classroom);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setSelectedClassroom(null);
    setIsDeleteModalOpen(false);
  };

  const handleConfirmDelete = async () => {
    if (!selectedClassroom) return;
    setIsDeleting(true);
    setError(null);
    
    try {
      await axios.delete(`${API_BASE_URL}/classrooms/${selectedClassroom.id}`);
      fetchAllClassrooms(currentPage);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Error al eliminar el aula.");
      console.error("Delete classroom error:", err);
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  // Filter classrooms by search term
  const filteredClassrooms = classrooms.filter(classroom =>
    classroom.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classroom.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acceso Denegado</h3>
          <p className="text-gray-600">No tienes permisos para ver esta página. Se requieren privilegios de administrador.</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && classrooms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header con padding */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <h1 className="text-3xl font-bold text-gray-900">Todas las Aulas (Vista Admin)</h1>
            <p className="mt-1 text-sm text-gray-500">Gestión centralizada de aulas del sistema</p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
      {/* Header con padding mejorado */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Todas las Aulas (Vista Admin)</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gestión centralizada de aulas del sistema
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <Building className="h-4 w-4 mr-1" />
                  {classrooms.length} {classrooms.length === 1 ? 'aula' : 'aulas'}
                </div>
                <Button
                  onClick={openCreateModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>Nueva Aula</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content con padding mejorado */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search bar con margen */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="relative max-w-lg">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar aulas por nombre o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando aulas...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredClassrooms.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm ? 'No se encontraron aulas' : 'No hay aulas registradas'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchTerm 
                ? 'Intenta con términos de búsqueda diferentes.'
                : 'Comienza creando tu primera aula.'
              }
            </p>
            {!searchTerm && (
              <Button
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 mx-auto transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Crear Primera Aula</span>
              </Button>
            )}
          </div>
        )}

        {/* Classrooms Table */}
        {!isLoading && filteredClassrooms.length > 0 && (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre del Aula
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Capacidad
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Escuela
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredClassrooms.map((classroom, index) => (
                    <tr key={classroom.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Building className="h-5 w-5 text-blue-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{classroom.name}</div>
                            <div className="text-sm text-gray-500">ID: {classroom.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900">
                            {classroom.capacity !== null ? `${classroom.capacity} estudiantes` : 'No especificada'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link 
                          href={`/schools/${classroom.school_id}`}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                        >
                          {classroom.school_id}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Link href={`/classrooms/${classroom.id}`}>
                            <button 
                              className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors"
                              title="Ver detalles"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                          </Link>
                          <button 
                            onClick={() => openEditModal(classroom)}
                            className="text-yellow-600 hover:text-yellow-800 bg-yellow-50 hover:bg-yellow-100 p-2 rounded-lg transition-colors"
                            title="Editar aula"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(classroom)}
                            className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors"
                            title="Eliminar aula"
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

            {/* Pagination */}
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPage === 0}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={!hasNextPage}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Siguiente
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Mostrando página <span className="font-medium">{currentPage + 1}</span>
                      {totalClassrooms > limit && (
                        <span> de aproximadamente <span className="font-medium">{totalPages}</span></span>
                      )}
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={handlePreviousPage}
                        disabled={currentPage === 0}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleNextPage}
                        disabled={!hasNextPage}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {selectedSchoolId && (
        <CreateClassroomModal
          isOpen={isCreateModalOpen}
          onClose={closeCreateModal}
          schoolId={selectedSchoolId}
          onClassroomCreated={handleClassroomCreated}
        />
      )}

      {selectedClassroom && (
        <EditClassroomModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          classroom={selectedClassroom}
          onClassroomUpdated={handleClassroomUpdated}
        />
      )}

      {selectedClassroom && (
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
                {isDeleting ? 'Eliminando...' : 'Eliminar Aula'}
              </Button>
            </>
          }
        >
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-6 w-6 text-red-500 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm text-gray-900">
                ¿Estás seguro de que quieres eliminar el aula <span className="font-semibold">{selectedClassroom.name}</span>?
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Esta acción no se puede deshacer. Todos los estudiantes y datos asociados también podrían verse afectados.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AllClassroomsAdminPage;
