"use client";

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface DownloadReportButtonProps {
  reportType: 'assets' | 'incidents' | 'overview';
  preset?: string;
  startDate?: string;
  endDate?: string;
  schoolId?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'success';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

const DownloadReportButton: React.FC<DownloadReportButtonProps> = ({
  reportType,
  preset = 'month',
  startDate,
  endDate,
  schoolId,
  className = '',
  variant = 'primary',
  size = 'md',
  label,
  onSuccess,
  onError
}) => {
  const { token } = useAuth();
  const [isDownloading, setIsDownloading] = useState(false);

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-700 text-white',
    success: 'bg-green-600 hover:bg-green-700 text-white'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const reportTypeLabels = {
    'assets': 'Activos',
    'incidents': 'Incidentes',
    'overview': 'General'
  };

  const defaultLabel = label || `Descargar Reporte ${reportTypeLabels[reportType]}`;

  const downloadReport = async () => {
    if (!token) {
      const error = new Error('No hay token de autenticación');
      if (onError) onError(error);
      return;
    }

    setIsDownloading(true);

    try {
      // Build query parameters
      const params: any = {};

      if (startDate && endDate) {
        params.start_date = startDate;
        params.end_date = endDate;
      } else if (preset) {
        params.preset = preset;
      }

      if (schoolId) {
        params.school_id = schoolId;
      }

      // Build URL with query params
      const queryString = new URLSearchParams(params).toString();
      const url = `${API_BASE_URL}/reports/${reportType}/export${queryString ? `?${queryString}` : ''}`;

      // Fetch PDF from backend
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Error al descargar reporte: ${response.status}`);
      }

      // Get the blob
      const blob = await response.blob();

      // Create download link
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;

      // Generate filename
      const date = new Date().toISOString().split('T')[0];
      link.download = `reporte-${reportTypeLabels[reportType].toLowerCase()}-${date}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      if (onSuccess) onSuccess();
    } catch (err: any) {
      console.error('Error downloading report:', err);
      if (onError) onError(err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <button
      onClick={downloadReport}
      disabled={isDownloading}
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        rounded-lg font-medium flex items-center
        transition-colors disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {isDownloading ? (
        <>
          <Loader2 className={`${iconSizes[size]} mr-2 animate-spin`} />
          Descargando...
        </>
      ) : (
        <>
          <Download className={`${iconSizes[size]} mr-2`} />
          {defaultLabel}
        </>
      )}
    </button>
  );
};

export default DownloadReportButton;
