"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Button from '@/components/ui/Button';
import { ArrowLeftIcon, PencilSquareIcon, TrashIcon, BuildingOffice2Icon, PrinterIcon, QrCodeIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';

// --- Interfaces (reuse from assets/page.tsx or a shared types file if available) ---
interface AssetCategory {
  id: string;
  name: string;
}
interface AssetTemplate {
  id: string;
  name: string;
  description?: string | null;
  manufacturer?: string | null;
  model_number?: string | null;
  category_id: string;
  category: AssetCategory;
}
interface QRCode {
  id: string;
  asset_id: string;
  qr_url: string;
  payload: {
    asset_id: string;
    serial_number: string;
    template_name: string;
  };
}
interface Asset {
  id: string;
  template_id: string;
  serial_number: string;
  purchase_date: string | null;
  value_estimate: number | null;
  image_url: string | null;
  status: string;
  classroom_id: string | null;
  created_at: string;
  updated_at: string;
  template: AssetTemplate;
  qr_code: QRCode | null;
}
interface ClassroomStub {
  id: string;
  name: string;
}

const API_BASE_URL = 'http://localhost:8000/api';

const AssetDetailPage = ({ params }: { params: { asset_id: string } }) => {
  const router = useRouter();
  const asset_id = params.asset_id;

  const [asset, setAsset] = useState<Asset | null>(null);
  const [classroom, setClassroom] = useState<ClassroomStub | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClassroomLoading, setIsClassroomLoading] = useState(false);

  const fetchAssetDetails = useCallback(async (id: string) => {
    if (!id) {
      setIsLoading(false);
      setError("Asset ID is missing.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/assets/${id}`);
      setAsset(response.data);
      if (response.data.classroom_id) {
        fetchClassroomName(response.data.classroom_id);
      }
    } catch (err: any) {
      if (err.response && err.response.status === 404) {
        setError('Asset not found.');
      } else {
        setError(err.response?.data?.detail || 'Failed to fetch asset details.');
      }
      console.error("Fetch asset details error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchClassroomName = useCallback(async (classroomId: string) => {
    setIsClassroomLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/classrooms/${classroomId}`);
      setClassroom({ id: response.data.id, name: response.data.name });
    } catch (err) {
      console.error("Failed to fetch classroom name:", err);
      // Non-critical error, classroom_id will be displayed as fallback
    } finally {
      setIsClassroomLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAssetDetails(asset_id);
  }, [asset_id, fetchAssetDetails]);

  const handlePrintQrCode = () => {
    if (asset?.qr_code?.qr_url) {
      const printWindow = window.open(asset.qr_code.qr_url, '_blank');
      printWindow?.addEventListener('load', function() {
        printWindow.print();
        // printWindow.close(); // Optional: close after print dialog is actioned
      });
    } else {
      alert("QR Code URL is not available.");
    }
  };

  // Placeholder for Edit/Delete Modals integration
  const handleEditAsset = () => alert(`Edit asset: ${asset?.serial_number} (to be implemented)`);
  const handleDeleteAsset = () => alert(`Delete asset: ${asset?.serial_number} (to be implemented)`);

  const formatDate = (dateString: string | null) => dateString ? new Date(dateString).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
  const formatDateTime = (dateString: string | null) => dateString ? new Date(dateString).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A';


  if (isLoading) {
    return <div className="p-6 text-center"><p className="text-lg text-neutralTextSecondary">Loading asset details...</p></div>;
  }
  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-lg text-accentRed bg-red-50 p-4 rounded-md">{error}</p>
        <Button variant="secondary" onClick={() => router.push('/assets')} className="mt-4">
          <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Assets List
        </Button>
      </div>
    );
  }
  if (!asset) {
    return <div className="p-6 text-center"><p className="text-lg text-neutralTextSecondary">Asset data not available.</p></div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex justify-start mb-2">
        <Button variant="secondary" onClick={() => router.push('/assets')}>
          <ArrowLeftIcon className="w-5 h-5 mr-2" /> Back to Assets List
        </Button>
      </div>

      <div className="bg-white shadow-xl rounded-radiusLarge p-6 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Column: Image & QR Code */}
          <div className="lg:w-1/3 space-y-6">
            {asset.image_url ? (
              <div>
                <h3 className="text-md font-semibold text-neutralDark mb-2">Asset Image</h3>
                <img src={asset.image_url} alt={`Asset ${asset.serial_number}`} className="rounded-radiusMedium border border-neutralLight object-cover w-full max-h-80" />
              </div>
            ) : (
              <div className="p-4 border border-dashed border-neutralMedium rounded-radiusMedium text-center text-neutralTextSecondary bg-neutralLighter">
                No image provided
              </div>
            )}
            {asset.qr_code?.qr_url && (
              <div className="text-center p-4 border border-neutralLight rounded-radiusMedium">
                <h3 className="text-md font-semibold text-neutralDark mb-2">QR Code</h3>
                <img src={asset.qr_code.qr_url} alt={`QR Code for ${asset.serial_number}`} className="w-48 h-48 mx-auto mb-3 border border-neutralMedium p-1" />
                <div className="space-y-2">
                     <a href={asset.qr_code.qr_url} target="_blank" rel="noopener noreferrer" download={`qr_${asset.serial_number}.png`}>
                        <Button variant="secondary" size="small" className="w-full">
                            <QrCodeIcon className="w-4 h-4 mr-2"/> Download QR
                        </Button>
                    </a>
                    <Button variant="secondary" size="small" onClick={handlePrintQrCode} className="w-full">
                        <PrinterIcon className="w-4 h-4 mr-2"/> Print QR Code
                    </Button>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="lg:w-2/3 space-y-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-neutralDarker">
              {asset.template.name} - <span className="text-neutralTextSecondary">{asset.serial_number}</span>
            </h1>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
              <div>
                <dt className="font-medium text-neutralTextSecondary">Status</dt>
                <dd className={`mt-1 px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    asset.status === 'available' ? 'bg-green-100 text-green-800' :
                    asset.status === 'in_use' ? 'bg-blue-100 text-blue-800' :
                    asset.status === 'maintenance' ? 'bg-yellow-100 text-yellow-800' :
                    asset.status === 'retired' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>{asset.status.replace('_', ' ')}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutralTextSecondary">Category</dt>
                <dd className="mt-1 text-neutralDark">{asset.template.category.name}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutralTextSecondary">Manufacturer</dt>
                <dd className="mt-1 text-neutralDark">{asset.template.manufacturer || 'N/A'}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutralTextSecondary">Model Number</dt>
                <dd className="mt-1 text-neutralDark">{asset.template.model_number || 'N/A'}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutralTextSecondary">Purchase Date</dt>
                <dd className="mt-1 text-neutralDark">{formatDate(asset.purchase_date)}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutralTextSecondary">Value Estimate</dt>
                <dd className="mt-1 text-neutralDark">{asset.value_estimate !== null ? `$${asset.value_estimate.toFixed(2)}` : 'N/A'}</dd>
              </div>
              <div>
                <dt className="font-medium text-neutralTextSecondary">Assigned Classroom</dt>
                <dd className="mt-1 text-neutralDark">
                  {isClassroomLoading ? "Loading..." : classroom ? (
                    <Link href={`/classrooms/${classroom.id}`} className="text-shopifyGreen hover:underline">
                      {classroom.name}
                    </Link>
                  ) : asset.classroom_id ? asset.classroom_id.substring(0,8) + "..." : 'N/A'}
                </dd>
              </div>
               <div>
                <dt className="font-medium text-neutralTextSecondary">Asset ID</dt>
                <dd className="mt-1 text-neutralDark">{asset.id}</dd>
              </div>
            </dl>

            <div className="pt-4 border-t border-neutralLight text-xs text-neutralTextSecondary space-y-1">
                <p>Created: {formatDateTime(asset.created_at)}</p>
                <p>Last Updated: {formatDateTime(asset.updated_at)}</p>
            </div>

          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-neutralLight flex flex-col sm:flex-row sm:justify-end sm:space-x-3 space-y-3 sm:space-y-0">
          <Button variant="secondary" onClick={handleEditAsset}>
            <PencilSquareIcon className="w-5 h-5 mr-2" /> Edit Asset
          </Button>
          <Button variant="destructive" onClick={handleDeleteAsset}>
            <TrashIcon className="w-5 h-5 mr-2" /> Delete Asset
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AssetDetailPage;
