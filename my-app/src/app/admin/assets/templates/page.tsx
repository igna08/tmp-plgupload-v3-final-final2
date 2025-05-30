"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select'; // For category filter
import { useAuth } from '@/context/AuthContext';
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, PencilIcon, PlusIcon, ShieldExclamationIcon, TrashIcon, FunnelIcon } from '@heroicons/react/24/outline';
import CreateAssetTemplateModal from '@/components/assets/templates/CreateAssetTemplateModal';
import EditAssetTemplateModal from '@/components/assets/templates/EditAssetTemplateModal';
import Modal from '@/components/ui/Modal'; // For delete confirmation

// Interfaces
interface AssetCategory {
  id: string;
  name: string;
  // Add other fields if needed by other parts, but for dropdown, id and name are key.
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
  category: { // Nested category information
    id: string;
    name: string;
  };
}

const API_BASE_URL = 'http://localhost:8000/api';

const AssetTemplatesPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth();

  const [templates, setTemplates] = useState<AssetTemplate[]>([]);
  const [categories, setCategories] = useState<AssetCategory[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true); // For template data fetching
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AssetTemplate | null>(null); // Used for Edit and Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete operation

  const totalPages = Math.ceil(totalItems / limit);

  // Fetch Asset Categories for the filter dropdown and for Create/Edit Modals
  useEffect(() => {
    const fetchAllCategories = async () => {
      if (!user?.is_superuser) return;
      try {
        // Assuming the categories endpoint doesn't require pagination for a dropdown,
        // or fetching first 100 is enough. Adjust if many categories.
        const response = await axios.get(`${API_BASE_URL}/assets/categories/?limit=1000`); // Fetch all for dropdown
        setCategories(response.data || []);
      } catch (err) {
        console.error("Failed to fetch categories for filter:", err);
        // setError("Failed to load category filters."); // Or handle more gracefully
      }
    };
    if (!isAuthLoading && user?.is_superuser) {
        fetchAllCategories();
    }
  }, [user, isAuthLoading]);

  // Fetch Asset Templates (all or filtered by category)
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

      setTemplates(response.data || []); // Ensure it's an array
      // Inferring total (less ideal, API should provide 'total' in response)
      // This logic might need adjustment if the API response structure for total items differs
      const fetchedCount = response.data?.length || 0;
      if (page === 0 && fetchedCount < limit) {
        setTotalItems(fetchedCount);
      } else if (fetchedCount < limit) {
        setTotalItems(page * limit + fetchedCount);
      } else {
        // If API returns a full page, there might be more.
        // A dedicated count from API (e.g. response.headers['x-total-count'] or in body) is better.
        setTotalItems((page + 1) * limit + 1); // Optimistic guess
      }

    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch asset templates.');
      console.error("Fetch asset templates error:", err);
      setTemplates([]); // Clear templates on error
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
    setCurrentPage(0); // Reset to first page when filter changes
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
    // Refetch templates, preferably for the current filter or all if no filter
    fetchTemplates(currentPage, selectedCategoryId);
    // Or: fetchTemplates(0, selectedCategoryId); // Go to first page of current filter
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
      fetchTemplates(currentPage, selectedCategoryId); // Refresh list
      // Potentially show success toast
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete asset template.");
      console.error("Delete asset template error:", err);
    } finally {
      setIsDeleting(false);
      closeDeleteModal();
    }
  };

  // Placeholder actions
  // const handleDeleteTemplate = (template: AssetTemplate) => alert(`Delete ${template.name} (to be implemented)`); // Replaced

  if (isAuthLoading) {
    return <div className="p-6 text-center"><p>Verifying admin access...</p></div>;
  }
  if (!user?.is_superuser) {
    return (
      <div className="p-6 text-center">
        <ShieldExclamationIcon className="w-16 h-16 text-accentRed mx-auto mb-4" />
        <h1 className="text-2xl font-semibold">Access Denied</h1>
        <p>You do not have permission to view this page.</p>
      </div>
    );
  }

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  const categoryOptions = [{ value: "all", label: "All Categories" }].concat(
    categories.map(cat => ({ value: cat.id, label: cat.name }))
  );

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-neutralDarker">Manage Asset Templates</h1>
        <Button variant="primary" onClick={openCreateModal}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Create New Template
        </Button>
      </div>

      {/* Filter Section */}
      <div className="p-4 bg-white rounded-radiusMedium shadow-sm">
        <label htmlFor="categoryFilter" className="block text-sm font-medium text-neutralDark mb-1">
          <FunnelIcon className="w-4 h-4 inline-block mr-1" />
          Filter by Category
        </label>
        <Select
          id="categoryFilter"
          options={categoryOptions}
          value={selectedCategoryId || "all"}
          onChange={handleCategoryFilterChange}
          className="min-w-[200px] md:min-w-[300px]"
        />
      </div>

      {isLoading && <p className="text-center py-4">Loading templates...</p>}
      {!isLoading && error && <p className="text-accentRed bg-red-50 p-3 rounded-md text-center">{error}</p>}

      {!isLoading && !error && templates.length === 0 && (
        <div className="text-center py-10 bg-white rounded-radiusMedium shadow">
           <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-neutralMedium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h3 className="mt-2 text-lg font-medium text-neutralDark">No asset templates found.</h3>
          {selectedCategoryId && <p className="mt-1 text-sm text-neutralTextSecondary">No templates found for the selected category.</p>}
        </div>
      )}

      {!isLoading && !error && templates.length > 0 && (
        <>
          <div className="bg-white shadow-md rounded-radiusMedium overflow-x-auto">
            <table className="min-w-full divide-y divide-neutralLight">
              <thead className="bg-neutralLightest">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Manufacturer</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Model Number</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Created At</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Updated At</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutralLight">
                {templates.map((template, index) => (
                  <tr key={template.id} className={index % 2 === 0 ? undefined : 'bg-neutralLighter/50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutralDarker">{template.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{template.category?.name || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{template.manufacturer || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{template.model_number || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{formatDate(template.created_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{formatDate(template.updated_at)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {/* View details might not be a separate page for templates, but icon can be kept for consistency */}
                      <Button variant="icon" size="small" onClick={() => alert(`View ${template.name}`)} title="View Details (Placeholder)">
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="icon" size="small" onClick={() => openEditModal(template)} title="Edit Template">
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="icon" size="small" onClick={() => openDeleteModal(template)} title="Delete Template">
                        <TrashIcon className="w-4 h-4 text-accentRed" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination Controls */}
          <div className="flex items-center justify-between pt-4">
            <div><p className="text-sm text-neutralTextSecondary">Page {currentPage + 1} of {totalPages > 0 ? totalPages : 1}</p></div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={handlePreviousPage} disabled={currentPage === 0} size="small">
                <ChevronLeftIcon className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button variant="secondary" onClick={handleNextPage} disabled={currentPage >= totalPages -1 || templates.length < limit} size="small">
                Next <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}

      <CreateAssetTemplateModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateModal}
        onTemplateCreated={handleTemplateCreated}
        categories={categories} // Pass fetched categories to the modal
      />

      {selectedTemplate && (
        <EditAssetTemplateModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          template={selectedTemplate}
          onTemplateUpdated={handleTemplateUpdated}
          categories={categories} // Pass categories for the dropdown
        />
      )}

      {selectedTemplate && (
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
                {isDeleting ? 'Deleting...' : 'Delete Template'}
              </Button>
            </>
          }
        >
          <div className="flex items-start space-x-3">
            <ShieldExclamationIcon className="h-6 w-6 text-accentRed flex-shrink-0" aria-hidden="true" />
            <div>
                <p className="text-sm text-neutralDark">
                Are you sure you want to delete the asset template <span className="font-semibold">{selectedTemplate.name}</span>?
                </p>
                <p className="mt-1 text-sm text-neutralTextSecondary">
                This action cannot be undone.
                </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssetTemplatesPage;
