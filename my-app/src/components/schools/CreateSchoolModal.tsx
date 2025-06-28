"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import { 
  X, 
  Building, 
  MapPin, 
  FileText, 
  Image, 
  AlertCircle, 
  Loader2,
  Check
} from 'lucide-react';

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

interface School {
  id: string;
  name: string;
  address: string;
  description: string | null;
  logo_url: string | null;
}

interface SchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolUpdated?: () => void;
  school?: School | null; // For editing
  mode: 'create' | 'edit';
}

interface SchoolFormData {
  name: string;
  address: string;
  description: string;
  logo_url: string;
}

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

const SchoolModal: React.FC<SchoolModalProps> = ({
  isOpen,
  onClose,
  onSchoolUpdated,
  school,
  mode = 'create',
}) => {
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    address: '',
    description: '',
    logo_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form when modal is opened/closed or school changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && school) {
        setFormData({
          name: school.name,
          address: school.address,
          description: school.description || '',
          logo_url: school.logo_url || '',
        });
      } else {
        setFormData({ name: '', address: '', description: '', logo_url: '' });
      }
      setErrors({});
      setGeneralError(null);
      setShowSuccess(false);
    }
    setIsSubmitting(false);
  }, [isOpen, school, mode]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
    if (generalError) setGeneralError(null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const payload: Partial<SchoolFormData> = { ...formData };
      if (!payload.description) delete payload.description;
      if (!payload.logo_url) delete payload.logo_url;

      if (mode === 'create') {
        await axios.post(`${API_BASE_URL}/schools/`, payload);
      } else if (mode === 'edit' && school) {
        await axios.put(`${API_BASE_URL}/schools/${school.id}`, payload);
      }

      setShowSuccess(true);
      
      // Close modal after showing success
      setTimeout(() => {
        if (onSchoolUpdated) {
          onSchoolUpdated();
        }
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error(`Failed to ${mode} school:`, err);
      if (err.response?.data?.detail) {
        const errorDetails = err.response.data.detail;
        if (Array.isArray(errorDetails)) {
          const newErrors: Record<string, string> = {};
          errorDetails.forEach((detail: ApiErrorDetail) => {
            if (detail.loc && detail.loc.length > 1) {
              newErrors[detail.loc[1]] = detail.msg;
            } else {
              setGeneralError(detail.msg || "Ocurrió un error de validación.");
            }
          });
          setErrors(newErrors);
          if (Object.keys(newErrors).length === 0 && !generalError) {
            setGeneralError("Error de validación. Por favor verifica tu información.");
          }
        } else if (typeof errorDetails === 'string') {
          setGeneralError(errorDetails);
        } else {
          setGeneralError('Ocurrió un error inesperado. Por favor intenta nuevamente.');
        }
      } else {
        setGeneralError('Error del servidor. Por favor intenta nuevamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity z-40"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 rounded-lg p-2">
                  <Building className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {mode === 'create' ? 'Nueva Escuela' : 'Editar Escuela'}
                  </h2>
                  <p className="text-blue-100 text-sm">
                    {mode === 'create' 
                      ? 'Completa la información para registrar una nueva escuela'
                      : 'Modifica la información de la escuela'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                disabled={isSubmitting}
                className="text-white hover:text-blue-100 transition-colors p-1 rounded-lg hover:bg-white hover:bg-opacity-10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="px-6 py-4 bg-green-50 border-b border-green-200">
              <div className="flex items-center space-x-3">
                <div className="bg-green-100 rounded-full p-2">
                  <Check className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-green-800 font-medium">
                    {mode === 'create' ? '¡Escuela creada exitosamente!' : '¡Escuela actualizada exitosamente!'}
                  </p>
                  <p className="text-green-600 text-sm">
                    {mode === 'create' 
                      ? 'La escuela ha sido registrada en el sistema.'
                      : 'Los cambios han sido guardados correctamente.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Content */}
          <div className="px-6 py-6 max-h-[60vh] overflow-y-auto">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* General Error */}
              {generalError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-800 font-medium">Error</p>
                      <p className="text-red-600 text-sm">{generalError}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* School Name */}
              <div>
                <label htmlFor="name" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Building className="h-4 w-4 text-gray-500" />
                  <span>Nombre de la Escuela</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="ej. Escuela Primaria San José"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.name 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.name && (
                  <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.name}</span>
                  </p>
                )}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span>Dirección</span>
                  <span className="text-red-500">*</span>
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="ej. Av. Libertador 1234, Ciudad"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.address 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.address && (
                  <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.address}</span>
                  </p>
                )}
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <FileText className="h-4 w-4 text-gray-500" />
                  <span>Descripción</span>
                  <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Breve descripción de la escuela, niveles educativos, etc."
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-none ${
                    errors.description 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.description}</span>
                  </p>
                )}
              </div>

              {/* Logo URL */}
              <div>
                <label htmlFor="logo_url" className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <Image className="h-4 w-4 text-gray-500" />
                  <span>URL del Logo</span>
                  <span className="text-gray-400 text-xs">(opcional)</span>
                </label>
                <input
                  id="logo_url"
                  name="logo_url"
                  type="url"
                  value={formData.logo_url}
                  onChange={handleChange}
                  placeholder="https://ejemplo.com/logo.png"
                  disabled={isSubmitting}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.logo_url 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                {errors.logo_url && (
                  <p className="text-red-600 text-sm mt-1 flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.logo_url}</span>
                  </p>
                )}
                {formData.logo_url && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 mb-2">Vista previa:</p>
                    <img 
                      src={formData.logo_url} 
                      alt="Preview" 
                      className="h-12 w-12 rounded-lg object-cover border border-gray-200"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting || showSuccess}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>{mode === 'create' ? 'Creando...' : 'Guardando...'}</span>
                  </>
                ) : showSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>¡Completado!</span>
                  </>
                ) : (
                  <span>{mode === 'create' ? 'Crear Escuela' : 'Guardar Cambios'}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SchoolModal;
