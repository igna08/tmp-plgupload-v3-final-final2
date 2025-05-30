"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import axios from 'axios'; // Using default axios instance
import Button from '@/components/ui/Button';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'; // Example icons
import Link from 'next/link';

// Define the School interface (should match the one in schools/page.tsx or a shared types file)
interface School {
  id: string;
  name: string;
  address: string;
  description: string | null;
  logo_url: string | null;
}

const API_BASE_URL = 'http://localhost:8000/api';

// Note: The App Router passes params directly to the page component
const SchoolDetailPage = ({ params }: { params: { school_id: string } }) => {
  const router = useRouter();
  const school_id = params.school_id;

  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchoolDetails = useCallback(async (id: string) => {
    if (!id) {
        setIsLoading(false);
        setError("School ID is missing.");
        return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/schools/${id}`);
      setSchool(response.data);
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError('School not found.');
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch school details.');
      }
      console.error("Fetch school details error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSchoolDetails(school_id);
  }, [school_id, fetchSchoolDetails]);

  const handleEditSchool = () => {
    // router.push(`/schools/${school_id}/edit`); // To be implemented
    alert(`Edit school: ${school?.name} (to be implemented)`);
  };

  const handleDeleteSchool = () => {
    // Logic for delete confirmation and API call (to be implemented)
    alert(`Delete school: ${school?.name} (to be implemented)`);
  };


  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-neutralTextSecondary">Loading school details...</p>
        {/* Consider adding a spinner component here */}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-accentRed bg-red-50 p-4 rounded-md">{error}</p>
        <Button variant="secondary" onClick={() => router.push('/schools')} className="mt-4">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Schools List
        </Button>
      </div>
    );
  }

  if (!school) {
    // This case should ideally be covered by the error state if school_id was valid but fetch failed.
    // If school_id was invalid from the start, error state should also cover it.
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-neutralTextSecondary">School data not available.</p>
         <Button variant="secondary" onClick={() => router.push('/schools')} className="mt-4">
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Schools List
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-start mb-6">
        <Button variant="secondary" onClick={() => router.push('/schools')}>
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          Back to Schools List
        </Button>
      </div>

      <div className="bg-white shadow-xl rounded-radiusLarge p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
          {school.logo_url && (
            <div className="flex-shrink-0 w-full md:w-1/3 lg:w-1/4 mb-6 md:mb-0">
              <img
                src={school.logo_url}
                alt={`${school.name} logo`}
                className="rounded-radiusMedium object-cover w-full h-auto max-h-64 border border-neutralLight"
              />
            </div>
          )}
          <div className={`flex-grow ${school.logo_url ? 'md:w-2/3 lg:w-3/4' : 'w-full'}`}>
            <h1 className="text-3xl font-bold text-neutralDarker mb-2">{school.name}</h1>
            <p className="text-md text-neutralTextSecondary mb-4">{school.address}</p>

            {school.description && (
              <div className="mt-4">
                <h2 className="text-lg font-semibold text-neutralDark mb-1">Description</h2>
                <p className="text-neutralTextSecondary whitespace-pre-wrap">{school.description}</p>
              </div>
            )}

            {/* Other details can be added here */}
            <div className="mt-6 border-t border-neutralLight pt-6">
                 <h2 className="text-lg font-semibold text-neutralDark mb-3">Additional Information</h2>
                 <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    <div className="sm:col-span-1">
                        <dt className="text-sm font-medium text-neutralTextSecondary">School ID</dt>
                        <dd className="mt-1 text-sm text-neutralDark">{school.id}</dd>
                    </div>
                    {/* Add more details if available from API, e.g., contact, type etc. */}
                 </dl>
            </div>

          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutralLight flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
          <Button variant="secondary" onClick={handleEditSchool}>
            <PencilSquareIcon className="w-5 h-5 mr-2" />
            Edit School
          </Button>
          <Button variant="destructive" onClick={handleDeleteSchool}>
            <TrashIcon className="w-5 h-5 mr-2" />
            Delete School
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SchoolDetailPage;
