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
  Users,
  AlertCircle,
  Loader2
} from 'lucide-react';
import Link from 'next/link';

// Classroom interface
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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(10);
  const [totalClassrooms, setTotalClassrooms] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);

  const totalPages = Math.max(1, Math.ceil(totalClassrooms / limit));

  const fetchAllClassrooms = useCallback(async (page: number) => {
    if (!user?.is_superuser) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${API_BASE_URL}/classrooms/`, {
        params: { skip: page * limit, limit: limit + 1 }, // Fetch one extra to check if there's a next page
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
      
      // Update total count estimation
      if (page === 0) {
        if (hasMore) {
          setTotalClassrooms(limit + 1); // At least one more page
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
        {/* Header */}
        <div className="bg-white shadow">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <h1 className="text-3xl font-bold text-gray-900">Todas las Aulas (Vista Admin)</h1>
              <p className="mt-1 text-sm text-gray-500">Gestión centralizada de aulas del sistema</p>
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
                  {classrooms.length} aulas cargadas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando aulas...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && classrooms.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron aulas</h3>
            <p className="text-gray-500">No hay aulas registradas en el sistema actualmente.</p>
          </div>
        )}

        {/* Classrooms Table */}
        {!isLoading && classrooms.length > 0 && (
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
                  {classrooms.map((classroom, index) => (
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
                        <Link href={`/classrooms/${classroom.id}`}>
                          <button className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors">
                            <Eye className="h-4 w-4" />
                          </button>
                        </Link>
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
    </div>
  );
};

export default AllClassroomsAdminPage;