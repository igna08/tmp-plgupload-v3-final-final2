"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // For navigation
import axios from 'axios'; // Using default axios instance
import Button from '@/components/ui/Button';
import Link from 'next/link';
import CreateClassroomModal from '@/components/classrooms/CreateClassroomModal'; // Import the modal

// Define the School interface
interface School {
  id: string;
  name: string;
  address: string;
  description: string | null;
  logo_url: string | null;
}

// Define the Classroom interface
interface Classroom {
  id: string;
  name: string;
  capacity: number;
  school_id: string;
}

// Local SVG Icons Components
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const PencilSquareIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
  </svg>
);

const PencilIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const PlusIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const EyeIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const API_BASE_URL = 'http://localhost:8000/api';

// Updated Props interface for async params
type Props = {
  params: Promise<{ school_id: string }>
}

const SchoolDetailPage = ({ params }: Props) => {
  const router = useRouter();
  const [school_id, setSchoolId] = useState<string>("");

  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState(true); // For school details
  const [error, setError] = useState<string | null>(null); // For school details

  // State for classrooms
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isClassroomsLoading, setIsClassroomsLoading] = useState(true);
  const [classroomsError, setClassroomsError] = useState<string | null>(null);
  const [currentClassroomsPage, setCurrentClassroomsPage] = useState(0);
  const [classroomsLimit] = useState(5); // Or your preferred default limit for classrooms
  const [totalClassrooms, setTotalClassrooms] = useState(0);
  const [isCreateClassroomModalOpen, setIsCreateClassroomModalOpen] = useState(false); // Modal state

  const totalClassroomPages = Math.ceil(totalClassrooms / classroomsLimit);

  // Resolve params on mount
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await params;
      setSchoolId(resolvedParams.school_id);
    };
    resolveParams();
  }, [params]);

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

  const fetchClassrooms = useCallback(async (id: string, page: number) => {
    if (!id) return;
    setIsClassroomsLoading(true);
    setClassroomsError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/schools/${id}/classrooms/`, {
        params: { skip: page * classroomsLimit, limit: classroomsLimit },
      });
      setClassrooms(response.data);
      // Assuming API does not return total for classrooms, inferring similar to schools list
      if (page === 0 && response.data.length < classroomsLimit) {
        setTotalClassrooms(response.data.length);
      } else if (response.data.length < classroomsLimit) {
        setTotalClassrooms(page * classroomsLimit + response.data.length);
      } else {
        setTotalClassrooms((page + 1) * classroomsLimit + 1);
      }
    } catch (err: any) {
      setClassroomsError(err.response?.data?.detail || 'Failed to fetch classrooms.');
      console.error("Fetch classrooms error:", err);
    } finally {
      setIsClassroomsLoading(false);
    }
  }, [classroomsLimit]);

  useEffect(() => {
    if (school_id) {
      fetchSchoolDetails(school_id);
    }
  }, [school_id, fetchSchoolDetails]);

  useEffect(() => {
    // Fetch classrooms when school details are loaded (school_id is confirmed valid)
    // or if school_id directly changes and is valid.
    if (school && school.id) { // Check if school object is populated
      fetchClassrooms(school.id, currentClassroomsPage);
    }
  }, [school, currentClassroomsPage, fetchClassrooms]);

  const handleEditSchool = () => {
    alert(`Edit school: ${school?.name} (to be implemented)`);
  };

  const handleDeleteSchool = () => {
    alert(`Delete school: ${school?.name} (to be implemented)`);
  };

  // Classroom Modal Handlers
  const openCreateClassroomModal = () => setIsCreateClassroomModalOpen(true);
  const closeCreateClassroomModal = () => setIsCreateClassroomModalOpen(false);

  const handleClassroomCreated = () => {
    // Refetch classrooms, ideally on the current page or first page
    if (school && school.id) {
      fetchClassrooms(school.id, currentClassroomsPage);
    }
    // Optionally, show a success notification here
  };

  const handleNextClassroomsPage = () => {
    if (currentClassroomsPage < totalClassroomPages - 1 && classrooms.length === classroomsLimit) {
      setCurrentClassroomsPage(prev => prev + 1);
    }
  };

  const handlePreviousClassroomsPage = () => {
    if (currentClassroomsPage > 0) {
      setCurrentClassroomsPage(prev => prev - 1);
    }
  };

  // Render logic for school details
  if (isLoading || !school_id) { // Initial loading for school details
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-neutralTextSecondary">Loading school details...</p>
      </div>
    );
  }

  if (error) { // Error fetching school details
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

  if (!school) { // Should be rare if error handling is correct
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

  // Main render for school details and classrooms
  return (
    <div className="p-4 md:p-6 space-y-8"> {/* Increased space between sections */}
      {/* School Details Section */}
      <div>
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
              <div className="mt-6 border-t border-neutralLight pt-6">
                   <h2 className="text-lg font-semibold text-neutralDark mb-3">Additional Information</h2>
                   <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                      <div className="sm:col-span-1">
                          <dt className="text-sm font-medium text-neutralTextSecondary">School ID</dt>
                          <dd className="mt-1 text-sm text-neutralDark">{school.id}</dd>
                      </div>
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

      {/* Classrooms Section */}
      <div className="bg-white shadow-xl rounded-radiusLarge p-6 md:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h2 className="text-2xl font-semibold text-neutralDarker">Classrooms in this School</h2>
          <Button variant="primary" onClick={openCreateClassroomModal} disabled={!school}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Add New Classroom
          </Button>
        </div>

        {isClassroomsLoading && (
          <p className="text-neutralTextSecondary text-center py-4">Loading classrooms...</p>
        )}
        {!isClassroomsLoading && classroomsError && (
          <p className="text-accentRed bg-red-50 p-3 rounded-md text-center">{classroomsError}</p>
        )}
        {!isClassroomsLoading && !classroomsError && classrooms.length === 0 && (
          <div className="text-center py-10">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-neutralMedium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" /></svg>
            <h3 className="mt-2 text-lg font-medium text-neutralDark">No classrooms found</h3>
            <p className="mt-1 text-sm text-neutralTextSecondary">Get started by adding a classroom to this school.</p>
            <div className="mt-6">
                <Button variant="primary" onClick={openCreateClassroomModal} disabled={!school}>
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add New Classroom
                </Button>
            </div>
          </div>
        )}
        {!isClassroomsLoading && !classroomsError && classrooms.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutralLight">
                <thead className="bg-neutralLightest">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Capacity</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutralLight">
                  {classrooms.map((classroom, index) => (
                    <tr key={classroom.id} className={index % 2 === 0 ? undefined : 'bg-neutralLighter/50'}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutralDarker">
                        <Link href={`/classrooms/${classroom.id}`} className="hover:underline text-shopifyGreen hover:text-green-700">
                          {classroom.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{classroom.capacity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {/* View button removed as name is now a link */}
                        <Button variant="ghost" size="small" onClick={() => alert(`Edit ${classroom.name}`)} title="Edit Classroom">
                          <PencilIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="small" onClick={() => alert(`Delete ${classroom.name}`)} title="Delete Classroom">
                          <TrashIcon className="w-4 h-4 text-accentRed" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Pagination for Classrooms */}
            <div className="flex items-center justify-between pt-4">
              <div>
                <p className="text-sm text-neutralTextSecondary">
                  Page <span className="font-medium">{currentClassroomsPage + 1}</span> of <span className="font-medium">{totalClassroomPages > 0 ? totalClassroomPages : 1}</span>
                </p>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="secondary"
                  onClick={handlePreviousClassroomsPage}
                  disabled={currentClassroomsPage === 0}
                  size="small"
                >
                  <ChevronLeftIcon className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleNextClassroomsPage}
                  disabled={currentClassroomsPage >= totalClassroomPages - 1 || classrooms.length < classroomsLimit}
                  size="small"
                >
                  Next
                  <ChevronRightIcon className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {school && ( // Only render modal if school context (for schoolId) is available
        <CreateClassroomModal
          isOpen={isCreateClassroomModalOpen}
          onClose={closeCreateClassroomModal}
          schoolId={school.id}
          onClassroomCreated={handleClassroomCreated}
        />
      )}
    </div>
  );
};

export default SchoolDetailPage;