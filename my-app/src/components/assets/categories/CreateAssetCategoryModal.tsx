"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

const API_BASE_URL = 'http://localhost:8000/api';

interface CreateAssetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated?: () => void;
}

interface CategoryFormData {
  name: string;
  description: string;
}

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

const CreateAssetCategoryModal: React.FC<CreateAssetCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
}) => {
  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setFormData({ name: '', description: '' });
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
      const payload: Partial<CategoryFormData> = { name: formData.name };
      if (formData.description) { // Only include description if provided
        payload.description = formData.description;
      }

      await axios.post(`${API_BASE_URL}/assets/categories/`, payload);

      if (onCategoryCreated) {
        onCategoryCreated();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to create asset category:', err);
      if (err.response?.data?.detail) {
        const errorDetails = err.response.data.detail;
        if (Array.isArray(errorDetails)) {
          const newErrors: Record<string, string> = {};
          errorDetails.forEach((detail: ApiErrorDetail) => {
            if (detail.loc && detail.loc.length > 1) {
              newErrors[detail.loc[1]] = detail.msg;
            } else {
               setGeneralError(detail.msg || "An unknown validation error occurred.");
            }
          });
          setErrors(newErrors);
          if (Object.keys(newErrors).length === 0 && !generalError && errorDetails.length > 0) {
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
      title="Create New Asset Category"
      size="medium"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting}
            form="create-asset-category-form"
          >
            {isSubmitting ? 'Creating...' : 'Create Category'}
          </Button>
        </>
      }
    >
      <form id="create-asset-category-form" onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-red-50 border border-accentRed rounded-radiusSmall text-sm text-accentRed">
            {generalError}
          </div>
        )}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-neutralDark mb-1">
            Category Name <span className="text-accentRed">*</span>
          </label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Laptops, Furniture"
            disabled={isSubmitting}
            hasError={!!errors.name}
          />
          {errors.name && <p className="text-xs text-accentRed mt-1">{errors.name}</p>}
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
            placeholder="Optional: A brief description of the category"
            disabled={isSubmitting}
            hasError={!!errors.description}
          />
          {errors.description && <p className="text-xs text-accentRed mt-1">{errors.description}</p>}
        </div>
      </form>
    </Modal>
  );
};

export default CreateAssetCategoryModal;
