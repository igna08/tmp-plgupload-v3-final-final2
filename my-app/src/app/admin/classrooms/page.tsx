"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext'; // To check for admin/superuser
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// Classroom interface (reuse or define if not globally available)
interface Classroom {
  id: string;
  name: string;
  capacity: number | null;
  school_id: string;
}

// Minimal School interface for linking
interface SchoolStub {
    id: string;
    name?: string; // Name might not be fetched for this list initially
}

const API_BASE_URL = 'http://localhost:8000/api';

const AllClassroomsAdminPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For classroom data fetching
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(10); // Items per page
  const [totalClassrooms, setTotalClassrooms] = useState(0);

  const totalPages = Math.ceil(totalClassrooms / limit);

  const fetchAllClassrooms = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/classrooms/`, {
        params: { skip: page * limit, limit: limit },
      });
      setClassrooms(response.data);
      // Assuming API does not provide total, inferring (less ideal)
      if (page === 0 && response.data.length < limit) {
        setTotalClassrooms(response.data.length);
      } else if (response.data.length < limit) {
        setTotalClassrooms(page * limit + response.data.length);
      } else {
        setTotalClassrooms((page + 1) * limit + 1);
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch classrooms.');
      console.error("Fetch all classrooms error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!isAuthLoading && user?.is_superuser) {
      fetchAllClassrooms(currentPage);
    }
  }, [fetchAllClassrooms, currentPage, user, isAuthLoading]);


  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && classrooms.length === limit) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-neutralTextSecondary">Verifying admin access...</p>
      </div>
    );
  }

  if (!user?.is_superuser) {
    return (
      <div className="p-6 text-center">
        <ShieldExclamationIcon className="w-16 h-16 text-accentRed mx-auto mb-4" />
        <h1 className="text-2xl font-semibold text-neutralDarker mb-2">Access Denied</h1>
        <p className="text-neutralTextSecondary">You do not have permission to view this page.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-neutralDarker mb-6">All Classrooms (Admin View)</h1>
        <p className="text-neutralTextSecondary">Loading all classrooms...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-neutralDarker mb-6">All Classrooms (Admin View)</h1>
        <p className="text-accentRed bg-red-50 p-3 rounded-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-neutralDarker">All Classrooms (Admin View)</h1>
        {/* Add any top-level actions if needed, e.g., global classroom creation (though less common) */}
      </div>

      {classrooms.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-radiusMedium shadow">
           <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-neutralMedium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
          <h3 className="mt-2 text-lg font-medium text-neutralDark">No classrooms found in the system.</h3>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-radiusMedium overflow-x-auto">
          <table className="min-w-full divide-y divide-neutralLight">
            <thead className="bg-neutralLightest">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Classroom Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Capacity</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">School ID / Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutralLight">
              {classrooms.map((classroom, index) => (
                <tr key={classroom.id} className={index % 2 === 0 ? undefined : 'bg-neutralLighter/50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutralDarker">{classroom.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{classroom.capacity ?? 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">
                    <Link href={`/schools/${classroom.school_id}`} className="text-shopifyGreen hover:underline">
                        {classroom.school_id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link href={`/classrooms/${classroom.id}`} title="View Classroom Details">
                       <Button variant="icon" size="small">
                            <EyeIcon className="w-4 h-4" />
                       </Button>
                    </Link>
                    {/* Add other admin-specific actions if needed */}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {classrooms.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-sm text-neutralTextSecondary">
              Page <span className="font-medium">{currentPage + 1}</span> of <span className="font-medium">{totalPages > 0 ? totalPages : 1}</span>
            </p>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="secondary"
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
              size="small"
            >
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="secondary"
              onClick={handleNextPage}
              disabled={currentPage >= totalPages -1 || classrooms.length < limit}
              size="small"
            >
              Next
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AllClassroomsAdminPage;
