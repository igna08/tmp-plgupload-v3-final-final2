"use client";

import React, { useState, FormEvent, useEffect } from 'react';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select'; // For category selection

const API_BASE_URL = 'https://finalqr-1-2-27-6-25.onrender.com/api';

interface AssetCategory {
  id: string;
  name: string;
}

interface AssetTemplate { // For pre-filling the form
  id: string;
  name: string;
  description: string | null;
  manufacturer: string | null;
  model_number: string | null;
  category_id: string;
  // category: { id: string, name: string }; // Not strictly needed for form if category_id is present
}

interface EditAssetTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: AssetTemplate | null; // Template data to pre-fill
  onTemplateUpdated?: () => void;
  categories: AssetCategory[]; // Pass categories for the dropdown
}

interface TemplateUpdateFormData {
  name: string;
  description: string;
  manufacturer: string;
  model_number: string;
  category_id: string;
}

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

const EditAssetTemplateModal: React.FC<EditAssetTemplateModalProps> = ({
  isOpen,
  onClose,
  template,
  onTemplateUpdated,
  categories,
}) => {
  const [formData, setFormData] = useState<TemplateUpdateFormData>({
    name: '',
    description: '',
    manufacturer: '',
    model_number: '',
    category_id: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && template) {
      setFormData({
        name: template.name || '',
        description: template.description || '',
        manufacturer: template.manufacturer || '',
        model_number: template.model_number || '',
        category_id: template.category_id || (categories[0]?.id || ''),
      });
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    } else if (!isOpen) {
        // Reset form when modal is closed
        setFormData({ name: '', description: '', manufacturer: '', model_number: '', category_id: '' });
        setErrors({});
        setGeneralError(null);
        setIsSubmitting(false);
    }
  }, [isOpen, template, categories]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
    if (!template) {
      setGeneralError("Template data is missing.");
      return;
    }
     if (!formData.category_id) {
        setErrors(prev => ({...prev, category_id: "Category is required."}));
        setIsSubmitting(false);
        return;
    }

    setIsSubmitting(true);
    setErrors({});
    setGeneralError(null);

    try {
      const payload: any = {
        name: formData.name,
        category_id: formData.category_id,
        // Only send fields if they have a value or are explicitly set to null
        // (depends on API: does empty string clear, or should null be sent, or field omitted?)
        description: formData.description || null,
        manufacturer: formData.manufacturer || null,
        model_number: formData.model_number || null,
      };

      await axios.put(`${API_BASE_URL}/assets/templates/${template.id}`, payload);

      if (onTemplateUpdated) {
        onTemplateUpdated();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to update asset template:', err);
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

  const categoryOptions = categories.map(cat => ({ value: cat.id, label: cat.name }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Edit Asset Template: ${template?.name || ''}`}
      size="large"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || categoryOptions.length === 0}
            form="edit-asset-template-form"
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </>
      }
    >
      <form id="edit-asset-template-form" onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-red-50 border border-accentRed rounded-radiusSmall text-sm text-accentRed">
            {generalError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutralDark mb-1">
                Template Name <span className="text-accentRed">*</span>
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                disabled={isSubmitting}
                hasError={!!errors.name}
              />
              {errors.name && <p className="text-xs text-accentRed mt-1">{errors.name}</p>}
            </div>

            <div>
              <label htmlFor="category_id" className="block text-sm font-medium text-neutralDark mb-1">
                Category <span className="text-accentRed">*</span>
              </label>
               {categoryOptions.length > 0 ? (
                <Select
                    id="category_id"
                    name="category_id"
                    value={formData.category_id}
                    onChange={handleChange}
                    options={categoryOptions}
                    disabled={isSubmitting}
                    hasError={!!errors.category_id}
                />
                ) : (
                <p className="text-sm text-neutralTextSecondary mt-1">No categories available.</p>
              )}
              {errors.category_id && <p className="text-xs text-accentRed mt-1">{errors.category_id}</p>}
            </div>
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
            disabled={isSubmitting}
            hasError={!!errors.description}
          />
          {errors.description && <p className="text-xs text-accentRed mt-1">{errors.description}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-neutralDark mb-1">
                Manufacturer
              </label>
              <Input
                id="manufacturer"
                name="manufacturer"
                value={formData.manufacturer}
                onChange={handleChange}
                disabled={isSubmitting}
                hasError={!!errors.manufacturer}
              />
              {errors.manufacturer && <p className="text-xs text-accentRed mt-1">{errors.manufacturer}</p>}
            </div>

            <div>
              <label htmlFor="model_number" className="block text-sm font-medium text-neutralDark mb-1">
                Model Number
              </label>
              <Input
                id="model_number"
                name="model_number"
                value={formData.model_number}
                onChange={handleChange}
                disabled={isSubmitting}
                hasError={!!errors.model_number}
              />
              {errors.model_number && <p className="text-xs text-accentRed mt-1">{errors.model_number}</p>}
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default EditAssetTemplateModal;
