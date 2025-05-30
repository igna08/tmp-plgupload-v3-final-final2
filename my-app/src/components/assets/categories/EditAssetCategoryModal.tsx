"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';

const API_BASE_URL = 'http://localhost:8000/api';

interface AssetCategory {
  id: string;
  name: string;
  description: string | null;
  // No need for created_at, updated_at, templates for the edit form itself
}

interface EditAssetCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: AssetCategory | null; // Category data to pre-fill
  onCategoryUpdated?: () => void;
}

interface CategoryUpdateFormData {
  name: string;
  description: string;
}

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

const EditAssetCategoryModal: React.FC<EditAssetCategoryModalProps> = ({
  isOpen,
  onClose,
  category,
  onCategoryUpdated,
}) => {
  const [formData, setFormData] = useState<CategoryUpdateFormData>({
    name: '',
    description: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && category) {
      setFormData({
        name: category.name || '',
        description: category.description || '',
      });
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    } else if (!isOpen) {
        setFormData({ name: '', description: '' });
        setErrors({});
        setGeneralError(null);
        setIsSubmitting(false);
    }
  }, [isOpen, category]);

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
    if (!category) {
      setGeneralError("Category data is missing.");
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const payload: Partial<CategoryUpdateFormData> = { name: formData.name };
      // Only include description if it's not null. If API expects empty string for cleared description, adjust.
      // If API expects field to be omitted for "no change", then more complex logic is needed if we want to support that.
      // For now, always send description, even if empty string (if user cleared it).
      payload.description = formData.description || null; // Send null if empty, or "" based on API preference

      await axios.put(`${API_BASE_URL}/assets/categories/${category.id}`, payload);

      if (onCategoryUpdated) {
        onCategoryUpdated();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to update asset category:', err);
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
      title={`Edit Asset Category: ${category?.name || ''}`}
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
            form="edit-asset-category-form"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="edit-asset-category-form" onSubmit={handleSubmit} className="space-y-4">
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

export default EditAssetCategoryModal;
