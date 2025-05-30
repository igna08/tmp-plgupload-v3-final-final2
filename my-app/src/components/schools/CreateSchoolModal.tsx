"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

const API_BASE_URL = 'http://localhost:8000/api';

interface CreateSchoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSchoolCreated?: () => void; // Callback to refresh list or similar
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

const CreateSchoolModal: React.FC<CreateSchoolModalProps> = ({
  isOpen,
  onClose,
  onSchoolCreated,
}) => {
  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    address: '',
    description: '',
    logo_url: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({}); // For field-specific errors
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Reset form when modal is opened/closed
  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', address: '', description: '', logo_url: '' });
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: undefined })); // Clear error on change
    }
    if (generalError) setGeneralError(null); // Clear general error on any change
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      // Filter out empty optional fields like description or logo_url if API prefers them absent
      const payload: Partial<SchoolFormData> = { ...formData };
      if (!payload.description) delete payload.description;
      if (!payload.logo_url) delete payload.logo_url;

      await axios.post(`${API_BASE_URL}/schools/`, payload);

      if (onSchoolCreated) {
        onSchoolCreated();
      }
      onClose(); // Close modal on success
    } catch (err: any) {
      console.error('Failed to create school:', err);
      if (err.response?.data?.detail) {
        const errorDetails = err.response.data.detail;
        if (Array.isArray(errorDetails)) {
          const newErrors: Record<string, string> = {};
          errorDetails.forEach((detail: ApiErrorDetail) => {
            if (detail.loc && detail.loc.length > 1) {
              newErrors[detail.loc[1]] = detail.msg; // e.g. loc: ["body", "name"]
            } else {
               setGeneralError(detail.msg || "An unknown validation error occurred.");
            }
          });
          setErrors(newErrors);
          if (Object.keys(newErrors).length === 0 && !generalError) {
             setGeneralError("Validation failed. Please check your input.");
          }
        } else if (typeof errorDetails === 'string') {
          setGeneralError(errorDetails);
        } else {
          setGeneralError('An unexpected error occurred. Please try again.');
        }
      } else {
        setGeneralError('An unexpected server error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New School"
      size="medium"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit" // This will trigger the form's onSubmit
            onClick={handleSubmit} // Or attach to form's onSubmit directly
            disabled={isSubmitting}
            form="create-school-form" // Associate with form if Modal's structure separates it
          >
            {isSubmitting ? 'Creating...' : 'Create School'}
          </Button>
        </>
      }
    >
      <form id="create-school-form" onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-red-50 border border-accentRed rounded-radiusSmall text-sm text-accentRed">
            {generalError}
          </div>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutralDark mb-1">
            School Name <span className="text-accentRed">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Springfield Elementary"
            disabled={isSubmitting}
            hasError={!!errors.name}
          />
          {errors.name && <p className="text-xs text-accentRed mt-1">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-neutralDark mb-1">
            Address <span className="text-accentRed">*</span>
          </label>
          <Input
            id="address"
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g., 123 Main St, Springfield"
            disabled={isSubmitting}
            hasError={!!errors.address}
          />
          {errors.address && <p className="text-xs text-accentRed mt-1">{errors.address}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-neutralDark mb-1">
            Description
          </label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            placeholder="Optional: A brief description of the school"
            disabled={isSubmitting}
            hasError={!!errors.description}
          />
          {errors.description && <p className="text-xs text-accentRed mt-1">{errors.description}</p>}
        </div>

        <div>
          <label htmlFor="logo_url" className="block text-sm font-medium text-neutralDark mb-1">
            Logo URL
          </label>
          <Input
            id="logo_url"
            name="logo_url"
            type="url"
            value={formData.logo_url}
            onChange={handleChange}
            placeholder="https://example.com/logo.png"
            disabled={isSubmitting}
            hasError={!!errors.logo_url}
          />
          {errors.logo_url && <p className="text-xs text-accentRed mt-1">{errors.logo_url}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default CreateSchoolModal;
