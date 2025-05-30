"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, PencilIcon, PlusIcon, ShieldExclamationIcon, TrashIcon } from '@heroicons/react/24/outline';
// import Link from 'next/link';
import CreateAssetCategoryModal from '@/components/assets/categories/CreateAssetCategoryModal';
import EditAssetCategoryModal from '@/components/assets/categories/EditAssetCategoryModal';
import Modal from '@/components/ui/Modal'; // For delete confirmation

// AssetCategory interface
interface AssetCategoryTemplate {
    id: string;
    name: string;
    // other template fields if needed by UI, but not specified for list
}
interface AssetCategory {
  id: string;
  name: string;
  description: string | null;
  created_at: string; // Assuming string from API (ISO format)
  updated_at: string; // Assuming string from API (ISO format)
  templates: AssetCategoryTemplate[];
}

const API_BASE_URL = 'http://localhost:8000/api';

const AssetCategoriesPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true); // For category data fetching
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(10);
  const [totalCategories, setTotalCategories] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null); // Used for Edit and Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete operation

  const totalPages = Math.ceil(totalCategories / limit);

  const fetchCategories = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/assets/categories/`, {
        params: { skip: page * limit, limit: limit },
      });
      // Assuming API returns array directly. If it's { items: [], total: number }, adjust:
      setCategories(response.data);
      // Inferring total (less ideal, API should provide 'total' in response)
      if (page === 0 && response.data.length < limit) {
        setTotalCategories(response.data.length);
      } else if (response.data.length < limit) {
        setTotalCategories(page * limit + response.data.length);
      } else {
        setTotalCategories((page + 1) * limit + 1); // Optimistic guess
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch asset categories.');
      console.error("Fetch asset categories error:", err);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    if (!isAuthLoading && user?.is_superuser) {
      fetchCategories(currentPage);
    }
  }, [fetchCategories, currentPage, user, isAuthLoading]);

  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && categories.length === limit) {
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

  const handleCategoryCreated = () => {
    fetchCategories(currentPage); // Or fetchCategories(0) to go to the first page
    // Potentially show a success toast/notification here
  };

  const openEditModal = (category: AssetCategory) => {
    setSelectedCategory(category);
    setIsEditModalOpen(true);
  };
  const closeEditModal = () => {
    setSelectedCategory(null);
    setIsEditModalOpen(false);
  };
  const handleCategoryUpdated = () => {
    fetchCategories(currentPage);
    // Potentially show a success toast/notification here
  };

  const openDeleteModal = (category: AssetCategory) => {
    setSelectedCategory(category);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteModal = () => {
    setSelectedCategory(null);
    setIsDeleteModalOpen(false);
  };
  const handleConfirmDelete = async () => {
    if (!selectedCategory) return;
    setIsDeleting(true);
    setError(null); // Clear previous page errors
    try {
      await axios.delete(`${API_BASE_URL}/assets/categories/${selectedCategory.id}`);
      fetchCategories(currentPage); // Refresh list
      // Potentially show success toast
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete asset category.");
      console.error("Delete asset category error:", err);
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  // Placeholder actions for now
  // const handleDeleteCategory = (category: AssetCategory) => alert(`Delete ${category.name} (to be implemented)`); // Replaced
  const handleViewCategory = (category: AssetCategory) => alert(`View ${category.name} (to be implemented, or link name)`);


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
        <h1 className="text-2xl font-semibold text-neutralDarker mb-6">Manage Asset Categories</h1>
        <p className="text-neutralTextSecondary">Loading categories...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-neutralDarker mb-6">Manage Asset Categories</h1>
        <p className="text-accentRed bg-red-50 p-3 rounded-md">{error}</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-neutralDarker">Manage Asset Categories</h1>
        <Button variant="primary" onClick={openCreateModal}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Create New Category
        </Button>
      </div>

      {isLoading && categories.length === 0 ? null : categories.length === 0 ? ( // Avoid empty state during initial load
        <div className="text-center py-10 bg-white rounded-radiusMedium shadow">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-neutralMedium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" /></svg>
          <h3 className="mt-2 text-lg font-medium text-neutralDark">No asset categories found.</h3>
          <p className="mt-1 text-sm text-neutralTextSecondary">Get started by creating a new category.</p>
           <div className="mt-6">
            <Button variant="primary" onClick={openCreateModal}>
              <PlusIcon className="w-5 h-5 mr-2" />
              Create New Category
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-radiusMedium overflow-x-auto">
          <table className="min-w-full divide-y divide-neutralLight">
            <thead className="bg-neutralLightest">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Name</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Description</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Templates</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Created At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Updated At</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-neutralLight">
              {categories.map((category, index) => (
                <tr key={category.id} className={index % 2 === 0 ? undefined : 'bg-neutralLighter/50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutralDarker">{category.name}</td>
                  <td className="px-6 py-4 text-sm text-neutralTextSecondary max-w-xs truncate" title={category.description || ''}>{category.description || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{category.templates?.length || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{formatDate(category.created_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{formatDate(category.updated_at)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Button variant="icon" size="small" onClick={() => handleViewCategory(category)} title="View Details">
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="icon" size="small" onClick={() => openEditModal(category)} title="Edit Category">
                      <PencilIcon className="w-4 h-4" />
                    </Button>
                    <Button variant="icon" size="small" onClick={() => openDeleteModal(category)} title="Delete Category">
                      <TrashIcon className="w-4 h-4 text-accentRed" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {categories.length > 0 && (
        <div className="flex items-center justify-between pt-4">
          <div>
            <p className="text-sm text-neutralTextSecondary">
              Page <span className="font-medium">{currentPage + 1}</span> of <span className="font-medium">{totalPages > 0 ? totalPages : 1}</span>
            </p>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={handlePreviousPage} disabled={currentPage === 0} size="small">
              <ChevronLeftIcon className="w-4 h-4 mr-1" />
              Previous
            </Button>
            <Button variant="secondary" onClick={handleNextPage} disabled={currentPage >= totalPages -1 || categories.length < limit} size="small">
              Next
              <ChevronRightIcon className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      <CreateAssetCategoryModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onCategoryCreated={handleCategoryCreated}
      />

      {selectedCategory && (
        <EditAssetCategoryModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          category={selectedCategory}
          onCategoryUpdated={handleCategoryUpdated}
        />
      )}

      {selectedCategory && (
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
                {isDeleting ? 'Deleting...' : 'Delete Category'}
              </Button>
            </>
          }
        >
          <div className="flex items-start space-x-3">
            <ShieldExclamationIcon className="h-6 w-6 text-accentRed flex-shrink-0" aria-hidden="true" /> {/* Changed icon for variety */}
            <div>
                <p className="text-sm text-neutralDark">
                Are you sure you want to delete the category <span className="font-semibold">{selectedCategory.name}</span>?
                </p>
                <p className="mt-1 text-sm text-neutralTextSecondary">
                This action cannot be undone. Associated templates might also be affected or require attention.
                </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssetCategoriesPage;
