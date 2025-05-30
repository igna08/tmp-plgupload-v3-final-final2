"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios'; // Using the default axios instance configured by AuthContext
import Button from '@/components/ui/Button';
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, EyeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'; // Example icons
import CreateSchoolModal from '@/components/schools/CreateSchoolModal'; // Import the modal

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
  const [limit] = useState(10); // Items per page
  const [totalSchools, setTotalSchools] = useState(0); // Assuming API might provide total count or we infer
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // State for modal visibility

  // Helper to estimate total pages, or ideally get it from API if available
  const totalPages = Math.ceil(totalSchools / limit);


  const fetchSchools = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      // The AuthContext should have already set the default Authorization header for axios
      const response = await axios.get(`${API_BASE_URL}/schools/`, {
        params: { skip: page * limit, limit: limit },
      });
      // Assuming the API returns an array of schools directly.
      // If it's an object like { items: [], total: number }, adjust accordingly.
      setSchools(response.data);

      // Inferring total count for pagination (less ideal but works if API doesn't provide total)
      // If response.data.length < limit, it's likely the last page or only page
      // A more robust way is if the API returns a 'total' count.
      // For now, we'll manage isLastPage based on returned items.
      if (page === 0 && response.data.length < limit) {
        setTotalSchools(response.data.length);
      } else if (response.data.length < limit) {
        // On a subsequent page, if less than limit, means it's the last page
        setTotalSchools(page * limit + response.data.length);
      } else {
        // If we get a full page, there might be more. This is an optimistic guess.
        // A real 'total' from API is better.
        setTotalSchools((page + 1) * limit + 1); // at least one more item on next page
      }

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch schools. Ensure you are logged in and the API is running.');
      console.error("Fetch schools error:", err);
      setSchools([]); // Clear schools on error
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchSchools(currentPage);
  }, [fetchSchools, currentPage]);

  const handleNextPage = () => {
    if (currentPage < totalPages -1 && schools.length === limit) { // Second condition as a safety for inferred total
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
    fetchSchools(currentPage); // Refetch current page, or could go to page 0
    // Optionally, show a success notification here
  };

  if (isLoading && schools.length === 0) { // Show initial loading only if no schools are displayed yet
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-neutralDark mb-6">Schools</h1>
        <p className="text-neutralTextSecondary">Loading schools...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-neutralDark mb-6">Schools</h1>
        <p className="text-accentRed bg-red-50 p-3 rounded-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-neutralDarker">Schools</h1>
        <Button variant="primary" onClick={openCreateModal}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Create New School
        </Button>
      </div>

      {isLoading && schools.length === 0 ? null : schools.length === 0 ? ( // Avoid showing empty state during initial load
        <div className="text-center py-10 bg-white rounded-radiusMedium shadow">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-neutralMedium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m0 0a8.484 8.484 0 00-4.088.929M12 17.747a8.484 8.484 0 014.088.929M12 6.253c2.405-1.703 5.438-1.703 7.843 0M12 6.253C9.595 4.55 6.562 4.55 4.157 6.253m0 6.894C1.752 14.85 1.752 17.882 4.157 19.586m15.686-2.706C22.248 14.85 22.248 11.818 19.843 10.114" />
            {/* A more specific icon for "schools" or "empty list" could be used */}
          </svg>
          <h3 className="mt-2 text-lg font-medium text-neutralDark">No schools found</h3>
          <p className="mt-1 text-sm text-neutralTextSecondary">
            Get started by creating a new school.
          </p>
          <div className="mt-6">
            <Button variant="primary" onClick={openCreateModal}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New School
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-radiusMedium overflow-x-auto">
          <table className="min-w-full divide-y divide-neutralLight">
            <thead className="bg-neutralLightest">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Address</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutralLight">
              {schools.map((school, index) => (
                <tr key={school.id} className={index % 2 === 0 ? undefined : 'bg-neutralLighter/50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutralDarker">{school.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{school.address}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary truncate max-w-xs" title={school.description || ''}>
                    {school.description || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="icon" size="small" onClick={() => alert(`View ${school.name}`)} title="View Details">
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="icon" size="small" onClick={() => alert(`Edit ${school.name}`)} title="Edit School">
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                     <Button variant="icon" size="small" onClick={() => alert(`Delete ${school.name}`)} title="Delete School">
                      <TrashIcon className="w-4 h-4 text-accentRed" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Controls */}
      {!isLoading && schools.length > 0 && ( // Hide pagination during initial load or if no schools
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
              disabled={currentPage >= totalPages -1 || schools.length < limit}
              size="small"
            >
              Next
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <CreateSchoolModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onSchoolCreated={handleSchoolCreated}
      />
    </div>
  );
};

export default SchoolsPage;
