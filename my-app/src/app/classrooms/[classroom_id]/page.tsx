"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal'; // Import base Modal for confirmation
import Link from 'next/link'; // For linking back to school
import EditClassroomModal from '@/components/classrooms/EditClassroomModal'; // Import the modal
import { FC } from "react";

// Define the Classroom interface (reuse or define if not globally available)
interface Classroom {
  id: string;
  name: string;
  capacity: number | null; // Capacity can be optional or nullable based on API
  school_id: string;
}

// Minimal School interface for displaying name if fetched
interface SchoolStub {
    id: string;
    name: string;
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

const TrashIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const BuildingOffice2Icon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m2.25-18v18m13.5-18v18m2.25-18v18m-15-12h2.25m0 0h2.25m-2.25 0v6m2.25-6v6m0-6h2.25m-2.25 0v6m2.25-6v6m0-6h2.25m-2.25 0v6m2.25-6v6m-2.25-6v6m2.25-6v6" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

const API_BASE_URL = 'http://localhost:8000/api';
interface PageProps {
  params: {
    classroom_id: string;
  };
}
const ClassroomDetailPage: FC<PageProps> = ({ params }) => {
  const router = useRouter();
  const classroom_id = params.classroom_id;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [school, setSchool] = useState<SchoolStub | null>(null); // For displaying school name
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // For page-level errors
  const [isSchoolLoading, setIsSchoolLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // State for delete modal
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete operation


  const fetchClassroomDetails = useCallback(async (id: string) => {
    if (!id) {
      setIsLoading(false);
      setError("Classroom ID is missing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/classrooms/${id}`);
      setClassroom(response.data);
      // After fetching classroom, fetch school details for its name
      if (response.data.school_id) {
        fetchSchoolName(response.data.school_id);
      }
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError('Classroom not found.');
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch classroom details.');
      }
      console.error("Fetch classroom details error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSchoolName = useCallback(async (schoolId: string) => {
    setIsSchoolLoading(true);
    try {
        const response = await axios.get(`${API_BASE_URL}/schools/${schoolId}`);
        setSchool({id: response.data.id, name: response.data.name});
    } catch (err) {
        console.error("Failed to fetch school name:", err);
        // Not critical, so don't set main error, maybe a separate schoolError state if needed
    } finally {
        setIsSchoolLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchClassroomDetails(classroom_id);
  }, [classroom_id, fetchClassroomDetails]); // fetchClassroomDetails is stable due to useCallback

  const openEditModal = () => setIsEditModalOpen(true);
  const closeEditModal = () => setIsEditModalOpen(false);

  const handleClassroomUpdated = () => {
    // Refetch classroom details to show updated data
    fetchClassroomDetails(classroom_id);
    // Optionally, show a success notification here
  };

  const openDeleteModal = () => setIsDeleteModalOpen(true);
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const handleConfirmDelete = async () => {
    if (!classroom) {
      setError("Cannot delete: Classroom data is missing.");
      closeDeleteModal();
      return;
    }
    setIsDeleting(true);
    setError(null); // Clear previous page errors
    try {
      await axios.delete(`${API_BASE_URL}/classrooms/${classroom.id}`);
      // On successful deletion, redirect to the school's detail page
      // Toast/notification can be added here: "Classroom deleted successfully"
      router.push(`/schools/${classroom.school_id}`);
    } catch (err: any) {
      console.error("Delete classroom error:", err);
      // Display error on the page, as modal will be closed
      setError(err.response?.data?.detail || 'Failed to delete classroom.');
      closeDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-neutralTextSecondary">Loading classroom details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-accentRed bg-red-50 p-4 rounded-md">{error}</p>
        {classroom?.school_id && (
             <Button variant="secondary" onClick={() => router.push(`/schools/${classroom.school_id}`)} className="mt-4">
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                Back to School Details
            </Button>
        )}
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-neutralTextSecondary">Classroom data not available.</p>
         <Button variant="secondary" onClick={() => router.back()} className="mt-4">
            <ArrowLeftIcon className="w-5 h-5 mr-2" />
            Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-start mb-6">
        {classroom.school_id && (
          <Link href={`/schools/${classroom.school_id}`}>
            <Button variant="secondary">
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to School Details
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white shadow-xl rounded-radiusLarge p-6 md:p-8">
        <h1 className="text-3xl font-bold text-neutralDarker mb-4">
          Classroom: {classroom.name}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 mb-6">
          <div>
            <dt className="text-sm font-medium text-neutralTextSecondary">Capacity</dt>
            <dd className="mt-1 text-md text-neutralDark">
              {classroom.capacity !== null && classroom.capacity !== undefined ? classroom.capacity : 'N/A'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-neutralTextSecondary">School</dt>
            <dd className="mt-1 text-md text-neutralDark">
              {isSchoolLoading ? (
                "Loading school name..."
              ) : school ? (
                <Link href={`/schools/${school.id}`} className="text-shopifyGreen hover:underline flex items-center">
                  <BuildingOffice2Icon className="w-5 h-5 mr-1 inline-block"/> {school.name}
                </Link>
              ) : (
                classroom.school_id
              )}
            </dd>
          </div>
           <div>
            <dt className="text-sm font-medium text-neutralTextSecondary">Classroom ID</dt>
            <dd className="mt-1 text-md text-neutralDark">{classroom.id}</dd>
          </div>
        </div>

        {/* Placeholder for other classroom-specific details if any */}
        {/* e.g., list of students, schedule, etc. */}

        <div className="mt-8 pt-6 border-t border-neutralLight flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
          <Button variant="secondary" onClick={openEditModal} disabled={!classroom}>
            <PencilSquareIcon className="w-5 h-5 mr-2" />
            Edit Classroom
          </Button>
          <Button variant="destructive" onClick={openDeleteModal} disabled={!classroom}>
            <TrashIcon className="w-5 h-5 mr-2" />
            Delete Classroom
          </Button>
        </div>
      </div>

      {/* Edit Classroom Modal */}
      {classroom && (
        <EditClassroomModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          classroom={classroom}
          onClassroomUpdated={handleClassroomUpdated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {classroom && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteModal}
          title="Confirm Deletion"
          size="small"
          footer={
            <>
              <Button variant="secondary" onClick={closeDeleteModal} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Classroom'}
              </Button>
            </>
          }
        >
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-accentRed flex-shrink-0" aria-hidden="true" />
            <div>
                <p className="text-sm text-neutralDark">
                Are you sure you want to delete classroom <span className="font-semibold">{classroom.name}</span>?
                </p>
                <p className="mt-1 text-sm text-neutralTextSecondary">
                This action cannot be undone. All associated data might be lost.
                </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ClassroomDetailPage;