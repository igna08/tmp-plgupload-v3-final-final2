"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal'; // Import base Modal for confirmation
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, BuildingOffice2Icon, ExclamationTriangleIcon } from '@heroicons/react/24/outline'; // Example icons
import Link from 'next/link'; // For linking back to school
import EditClassroomModal from '@/components/classrooms/EditClassroomModal'; // Import the modal

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

const API_BASE_URL = 'http://localhost:8000/api';

const ClassroomDetailPage = ({ params }: { params: { classroom_id: string } }) => {
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
