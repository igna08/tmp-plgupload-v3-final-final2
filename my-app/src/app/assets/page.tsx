"use client";

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import { useAuth } from '@/context/AuthContext'; // For potential admin checks if needed later, not primary for this page
import { ChevronLeftIcon, ChevronRightIcon, EyeIcon, PencilIcon, PlusIcon, ShieldExclamationIcon, TrashIcon, FunnelIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import CreateAssetModal from '@/components/assets/CreateAssetModal';
import EditAssetModal from '@/components/assets/EditAssetModal';
import Modal from '@/components/ui/Modal'; // For delete confirmation

// --- Interfaces ---
interface AssetCategoryFilter {
  id: string;
  name: string;
}

interface AssetTemplateFilter {
  id: string;
  name: string;
}

interface Asset {
  id: string;
  template_id: string;
  serial_number: string;
  purchase_date: string | null; // Assuming ISO string
  value_estimate: number | null;
  image_url: string | null;
  status: string; // e.g., "available", "in_use", "maintenance", "retired"
  classroom_id: string | null;
  created_at: string;
  updated_at: string;
  template: {
    id: string;
    name: string;
    description?: string | null;
    manufacturer?: string | null;
    model_number?: string | null;
    category_id: string;
    category: {
      id: string;
      name: string;
    };
  };
  qr_code?: { // QR code might be optional or fetched separately
    id: string;
    asset_id: string;
    qr_url: string;
    payload: {
      asset_id: string;
      serial_number: string;
      template_name: string;
    };
  } | null;
  // Classroom details (e.g. name) are not directly part of asset, only classroom_id
}

const API_BASE_URL = 'http://localhost:8000/api';

// Status options for the filter - define based on common usage or API enum
const statusOptions = [
  { value: "", label: "All Statuses" },
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];


const AssetsPage: React.FC = () => {
  const { user, isLoading: isAuthLoading } = useAuth(); // Not strictly for admin check here, but good for context

  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<AssetCategoryFilter[]>([]);
  const [templates, setTemplates] = useState<AssetTemplateFilter[]>([]);

  // Filter states
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [limit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null); // Used for Edit and Delete
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false); // Loading state for delete operation

  const totalPages = Math.ceil(totalItems / limit);

  // --- Data Fetching ---
  const fetchAssets = useCallback(async (page: number, filters: Record<string, string>) => {
    setIsLoading(true);
    setError(null);
    try {
      const params: any = { skip: page * limit, limit: limit };
      if (filters.status) params.status = filters.status;
      if (filters.category_id) params.category_id = filters.category_id;
      if (filters.template_id) params.template_id = filters.template_id;
      // Add classroom_id filter if implemented: if (filters.classroom_id) params.classroom_id = filters.classroom_id;

      const response = await axios.get(`${API_BASE_URL}/assets/`, { params });

      setAssets(response.data || []);
      const fetchedCount = response.data?.length || 0;
      // This total items logic needs to be based on API providing total count,
      // ideally via response headers (e.g. X-Total-Count) or in the response body.
      // For now, using an optimistic guess if not last page.
      if (response.headers && response.headers['x-total-count']) {
          setTotalItems(parseInt(response.headers['x-total-count'], 10));
      } else { // Fallback if no x-total-count header
          if (page === 0 && fetchedCount < limit) {
            setTotalItems(fetchedCount);
          } else if (fetchedCount < limit) {
            setTotalItems(page * limit + fetchedCount);
          } else {
            setTotalItems((page + 1) * limit + 1);
          }
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch assets.');
      console.error("Fetch assets error:", err);
      setAssets([]);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const fetchFilterData = useCallback(async () => {
    try {
      const [categoriesRes, templatesRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/assets/categories/?limit=1000`), // Fetch all for dropdown
        axios.get(`${API_BASE_URL}/assets/templates/?limit=1000`),   // Fetch all for dropdown
      ]);
      setCategories(categoriesRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (err) {
      console.error("Failed to fetch filter data (categories/templates):", err);
      setError(prevError => prevError || "Failed to load filter options."); // Show error if not already one from assets
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading) { // Ensure auth state is resolved before fetching anything
      fetchFilterData();
      // Initial fetch for assets will be triggered by the filter useEffect
    }
  }, [isAuthLoading, fetchFilterData]);

  useEffect(() => {
      if(!isAuthLoading) { // Don't fetch assets until auth is resolved
        const filters = {
            status: selectedStatus,
            category_id: selectedCategoryId,
            template_id: selectedTemplateId,
        };
        fetchAssets(currentPage, filters);
      }
  }, [currentPage, selectedStatus, selectedCategoryId, selectedTemplateId, fetchAssets, isAuthLoading]);


  // --- Event Handlers ---
  const handleApplyFilters = () => {
    setCurrentPage(0); // Reset to first page
    const filters = {
        status: selectedStatus,
        category_id: selectedCategoryId,
        template_id: selectedTemplateId,
    };
    fetchAssets(0, filters); // fetchAssets will be called by useEffect due to currentPage change too
  };

  const handleResetFilters = () => {
    setSelectedStatus("");
    setSelectedCategoryId("");
    setSelectedTemplateId("");
    setCurrentPage(0); // Reset to first page
    // fetchAssets will be called by useEffect due to filter state changes
  };

  const handleNextPage = () => {
    if (currentPage < totalPages - 1 && assets.length === limit) { // assets.length === limit implies there might be more
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const openCreateAssetModal = () => setIsCreateModalOpen(true);
  const closeCreateAssetModal = () => setIsCreateModalOpen(false);

  const handleAssetCreated = () => {
    // Refetch assets, preferably for the current page and filters
    const currentFilters = {
        status: selectedStatus,
        category_id: selectedCategoryId,
        template_id: selectedTemplateId,
    };
    fetchAssets(currentPage, currentFilters);
    // Or: fetchAssets(0, currentFilters); // Go to first page
  };

  const openEditAssetModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsEditModalOpen(true);
  };
  const closeEditAssetModal = () => {
    setSelectedAsset(null);
    setIsEditModalOpen(false);
  };
  const handleAssetUpdated = () => {
    const currentFilters = {
        status: selectedStatus,
        category_id: selectedCategoryId,
        template_id: selectedTemplateId,
    };
    fetchAssets(currentPage, currentFilters);
  };

  const openDeleteAssetModal = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDeleteModalOpen(true);
  };
  const closeDeleteAssetModal = () => {
    setSelectedAsset(null);
    setIsDeleteModalOpen(false);
  };
  const handleConfirmDeleteAsset = async () => {
    if (!selectedAsset) return;
    setIsDeleting(true);
    setError(null);
    try {
      await axios.delete(`${API_BASE_URL}/assets/${selectedAsset.id}`);
      const currentFilters = {
        status: selectedStatus,
        category_id: selectedCategoryId,
        template_id: selectedTemplateId,
      };
      fetchAssets(currentPage, currentFilters); // Refresh list
      // Potentially show success toast
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to delete asset.");
      console.error("Delete asset error:", err);
    } finally {
      setIsDeleting(false);
      closeDeleteAssetModal();
    }
  };

  // const handleDeleteAsset = (asset: Asset) => alert(`Delete ${asset.serial_number} (to be implemented)`); // Replaced


  // --- Render Helper ---
  const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString() : 'N/A';

  const categoryOptionsForFilter = [{ value: "", label: "All Categories" }].concat(
    categories.map(cat => ({ value: cat.id, label: cat.name }))
  );
  const templateOptionsForFilter = [{ value: "", label: "All Templates" }].concat(
    templates.map(tmpl => ({ value: tmpl.id, label: tmpl.name }))
  );

  if (isAuthLoading) { // Initial auth loading
    return <div className="p-6 text-center"><p>Loading user authentication...</p></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-semibold text-neutralDarker">Manage Assets</h1>
        <Button variant="primary" onClick={openCreateAssetModal}>
          <PlusIcon className="w-5 h-5 mr-2" />
          Create New Asset
        </Button>
      </div>

      {/* Filter Section */}
      <div className="p-4 bg-white rounded-radiusMedium shadow-sm space-y-4 md:space-y-0 md:flex md:flex-wrap md:items-end md:gap-4">
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-neutralDark mb-1">Status</label>
          <Select id="statusFilter" options={statusOptions} value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)} className="min-w-[180px]" />
        </div>
        <div>
          <label htmlFor="categoryFilterAsset" className="block text-sm font-medium text-neutralDark mb-1">Category</label>
          <Select id="categoryFilterAsset" options={categoryOptionsForFilter} value={selectedCategoryId} onChange={e => setSelectedCategoryId(e.target.value)} className="min-w-[180px]" />
        </div>
        <div>
          <label htmlFor="templateFilterAsset" className="block text-sm font-medium text-neutralDark mb-1">Template</label>
          <Select id="templateFilterAsset" options={templateOptionsForFilter} value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)} className="min-w-[180px]" />
        </div>
        {/* Consider adding Apply button if you don't want useEffect to trigger on every select change */}
        <div className="flex items-end space-x-2 pt-5">
             <Button variant="secondary" onClick={handleApplyFilters} size="medium">
                <FunnelIcon className="w-4 h-4 mr-1"/> Apply Filters
            </Button>
            <Button variant="secondary" onClick={handleResetFilters} size="medium">
                Reset
            </Button>
        </div>
      </div>

      {isLoading && <p className="text-center py-10">Loading assets...</p>}
      {!isLoading && error && <p className="text-accentRed bg-red-50 p-3 rounded-md text-center">{error}</p>}

      {!isLoading && !error && assets.length === 0 && (
        <div className="text-center py-10 bg-white rounded-radiusMedium shadow">
          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-neutralMedium" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          <h3 className="mt-2 text-lg font-medium text-neutralDark">No assets found.</h3>
          { (selectedStatus || selectedCategoryId || selectedTemplateId) &&
            <p className="mt-1 text-sm text-neutralTextSecondary">Try adjusting your filters or create a new asset.</p>
          }
        </div>
      )}

      {!isLoading && !error && assets.length > 0 && (
        <>
          <div className="bg-white shadow-md rounded-radiusMedium overflow-x-auto">
            <table className="min-w-full divide-y divide-neutralLight">
              <thead className="bg-neutralLightest">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Serial #</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Template</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Purchase Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Classroom ID</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">QR Code</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-neutralDark uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-neutralLight">
                {assets.map((asset, index) => (
                  <tr key={asset.id} className={index % 2 === 0 ? undefined : 'bg-neutralLighter/50'}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutralDarker">{asset.serial_number}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{asset.template.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{asset.template.category.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            asset.status === 'available' ? 'bg-green-100 text-green-800' :
                            asset.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                            asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                            asset.status === 'retired' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                            {asset.status.replace('_', ' ')}
                        </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">{formatDate(asset.purchase_date)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">
                        {asset.classroom_id ? (
                            <Link href={`/classrooms/${asset.classroom_id}`} className="text-shopifyGreen hover:underline">
                                {asset.classroom_id.substring(0,8)}...
                            </Link>
                        ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-neutralTextSecondary">
                        {asset.qr_code?.qr_url ? (
                            <a href={asset.qr_code.qr_url} target="_blank" rel="noopener noreferrer" className="text-shopifyGreen hover:underline">
                                <QrCodeIcon className="w-5 h-5 inline-block"/> View QR
                            </a>
                        ) : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-1">
                      <Link href={`/assets/${asset.id}`} title="View Details">
                        <Button variant="icon" size="small">
                            <EyeIcon className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button variant="icon" size="small" onClick={() => openEditAssetModal(asset)} title="Edit Asset">
                        <PencilIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="icon" size="small" onClick={() => openDeleteAssetModal(asset)} title="Delete Asset">
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
            <div><p className="text-sm text-neutralTextSecondary">Page {currentPage + 1} of {totalPages > 0 ? totalPages : 1} (Total items: {totalItems})</p></div>
            <div className="flex space-x-2">
              <Button variant="secondary" onClick={handlePreviousPage} disabled={currentPage === 0} size="small">
                <ChevronLeftIcon className="w-4 h-4 mr-1" /> Previous
              </Button>
              <Button variant="secondary" onClick={handleNextPage} disabled={currentPage >= totalPages -1 || assets.length < limit} size="small">
                Next <ChevronRightIcon className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </>
      )}

      <CreateAssetModal
        isOpen={isCreateModalOpen}
        onClose={closeCreateAssetModal}
        onAssetCreated={handleAssetCreated}
      />

      {selectedAsset && (
        <EditAssetModal
          isOpen={isEditModalOpen}
          onClose={closeEditAssetModal}
          asset={selectedAsset}
          onAssetUpdated={handleAssetUpdated}
        />
      )}

      {selectedAsset && (
        <Modal
          isOpen={isDeleteModalOpen}
          onClose={closeDeleteAssetModal}
          title="Confirm Deletion"
          size="small"
          footer={
            <>
              <Button variant="secondary" onClick={closeDeleteAssetModal} disabled={isDeleting}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleConfirmDeleteAsset} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete Asset'}
              </Button>
            </>
          }
        >
          <div className="flex items-start space-x-3">
            <ShieldExclamationIcon className="h-6 w-6 text-accentRed flex-shrink-0" aria-hidden="true" />
            <div>
                <p className="text-sm text-neutralDark">
                Are you sure you want to delete the asset with serial number <span className="font-semibold">{selectedAsset.serial_number}</span>?
                </p>
                 <p className="mt-1 text-sm text-neutralTextSecondary">
                Template: {selectedAsset.template.name}
                </p>
                <p className="mt-2 text-sm text-neutralTextSecondary">
                This action cannot be undone.
                </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AssetsPage;
