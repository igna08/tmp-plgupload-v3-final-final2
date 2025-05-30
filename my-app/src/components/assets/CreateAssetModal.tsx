"use client";

import React, { useState, FormEvent, useEffect, useCallback } from 'react';
import axios from 'axios';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea'; // In case description is added to asset later

const API_BASE_URL = 'http://localhost:8000/api';

interface AssetTemplateOption {
  id: string;
  name: string;
}

interface ClassroomOption {
  id: string;
  name: string;
  // school_id might be useful for display if names aren't unique across schools
}

interface CreateAssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAssetCreated?: () => void;
}

interface AssetFormData {
  template_id: string;
  serial_number: string;
  purchase_date: string; // YYYY-MM-DD
  value_estimate: string; // Keep as string for form, convert on submit
  image_url: string;
  status: string;
  classroom_id: string; // Can be empty string for "none"
}

interface ApiErrorDetail {
  loc: string[];
  msg: string;
  type: string;
}

// Status options - should align with backend enum/choices
const statusOptions = [
  { value: "available", label: "Available" },
  { value: "in_use", label: "In Use" },
  { value: "maintenance", label: "Maintenance" },
  { value: "retired", label: "Retired" },
];

const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  isOpen,
  onClose,
  onAssetCreated,
}) => {
  const [formData, setFormData] = useState<AssetFormData>({
    template_id: '',
    serial_number: '',
    purchase_date: '',
    value_estimate: '',
    image_url: '',
    status: 'available', // Default status
    classroom_id: '',
  });

  const [templates, setTemplates] = useState<AssetTemplateOption[]>([]);
  const [classrooms, setClassrooms] = useState<ClassroomOption[]>([]);
  const [isDropdownDataLoading, setIsDropdownDataLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const fetchDropdownData = useCallback(async () => {
    if (!isOpen) return; // Only fetch if modal is open
    setIsDropdownDataLoading(true);
    try {
      const [templatesRes, classroomsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/assets/templates/?limit=1000`), // Fetch all templates
        axios.get(`${API_BASE_URL}/classrooms/?limit=1000`),       // Fetch all classrooms
      ]);
      setTemplates(templatesRes.data || []);
      setClassrooms(classroomsRes.data || []);
      // Set default template_id if templates are loaded and none is set
      if (templatesRes.data && templatesRes.data.length > 0 && !formData.template_id) {
        setFormData(prev => ({ ...prev, template_id: templatesRes.data[0].id }));
      }
    } catch (error) {
      console.error("Failed to load dropdown data for asset modal", error);
      setGeneralError("Failed to load options for templates or classrooms.");
    } finally {
      setIsDropdownDataLoading(false);
    }
  }, [isOpen, formData.template_id]); // formData.template_id to prevent re-setting if already has value

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]); // Runs when isOpen changes (due to fetchDropdownData's own dependency on isOpen)

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal is closed
      setFormData({
        template_id: templates[0]?.id || '', // Reset to first template or empty
        serial_number: '',
        purchase_date: '',
        value_estimate: '',
        image_url: '',
        status: 'available',
        classroom_id: '',
      });
      setErrors({});
      setGeneralError(null);
      setIsSubmitting(false);
    }
  }, [isOpen, templates]);


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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

    if (!formData.template_id) {
        setErrors(prev => ({...prev, template_id: "Template is required."}));
        setIsSubmitting(false);
        return;
    }
     if (!formData.status) {
        setErrors(prev => ({...prev, status: "Status is required."}));
        setIsSubmitting(false);
        return;
    }


    try {
      const payload: any = {
        template_id: formData.template_id,
        serial_number: formData.serial_number,
        status: formData.status,
      };
      if (formData.purchase_date) payload.purchase_date = formData.purchase_date;
      if (formData.value_estimate) payload.value_estimate = parseFloat(formData.value_estimate); // Convert to number
      if (formData.image_url) payload.image_url = formData.image_url;
      if (formData.classroom_id) payload.classroom_id = formData.classroom_id; // Send if selected
      else payload.classroom_id = null; // Send null if not selected, or omit based on API

      await axios.post(`${API_BASE_URL}/assets/`, payload);

      if (onAssetCreated) {
        onAssetCreated();
      }
      onClose();
    } catch (err: any) {
      console.error('Failed to create asset:', err);
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

  const templateOptions = templates.map(t => ({ value: t.id, label: t.name }));
  const classroomOptions = [{ value: "", label: "None (Unassigned)" }].concat(
    classrooms.map(c => ({ value: c.id, label: c.name }))
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Asset"
      size="large"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting || isDropdownDataLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            onClick={handleSubmit}
            disabled={isSubmitting || isDropdownDataLoading || templateOptions.length === 0}
            form="create-asset-form"
          >
            {isSubmitting ? 'Creating...' : 'Create Asset'}
          </Button>
        </>
      }
    >
      {isDropdownDataLoading ? <p className="text-center">Loading options...</p> :
      <form id="create-asset-form" onSubmit={handleSubmit} className="space-y-4">
        {generalError && (
          <div className="p-3 bg-red-50 border border-accentRed rounded-radiusSmall text-sm text-accentRed">
            {generalError}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="template_id" className="block text-sm font-medium text-neutralDark mb-1">
                Template <span className="text-accentRed">*</span>
              </label>
              {templateOptions.length > 0 ? (
                <Select
                    id="template_id"
                    name="template_id"
                    value={formData.template_id}
                    onChange={handleChange}
                    options={templateOptions}
                    disabled={isSubmitting}
                    hasError={!!errors.template_id}
                />
              ) : (
                 <p className="text-sm text-neutralTextSecondary mt-1 py-2 px-3 border border-neutralLight rounded-radiusSmall">No templates available. Create a template first.</p>
              )}
              {errors.template_id && <p className="text-xs text-accentRed mt-1">{errors.template_id}</p>}
            </div>
            <div>
              <label htmlFor="serial_number" className="block text-sm font-medium text-neutralDark mb-1">
                Serial Number <span className="text-accentRed">*</span>
              </label>
              <Input
                id="serial_number"
                name="serial_number"
                value={formData.serial_number}
                onChange={handleChange}
                placeholder="e.g., SN123456789"
                disabled={isSubmitting}
                hasError={!!errors.serial_number}
              />
              {errors.serial_number && <p className="text-xs text-accentRed mt-1">{errors.serial_number}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="status" className="block text-sm font-medium text-neutralDark mb-1">
                    Status <span className="text-accentRed">*</span>
                </label>
                <Select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={statusOptions}
                    disabled={isSubmitting}
                    hasError={!!errors.status}
                />
                {errors.status && <p className="text-xs text-accentRed mt-1">{errors.status}</p>}
            </div>
            <div>
              <label htmlFor="purchase_date" className="block text-sm font-medium text-neutralDark mb-1">
                Purchase Date
              </label>
              <Input
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={handleChange}
                disabled={isSubmitting}
                hasError={!!errors.purchase_date}
              />
              {errors.purchase_date && <p className="text-xs text-accentRed mt-1">{errors.purchase_date}</p>}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="value_estimate" className="block text-sm font-medium text-neutralDark mb-1">
                Value Estimate ($)
              </label>
              <Input
                id="value_estimate"
                name="value_estimate"
                type="number"
                step="0.01"
                value={formData.value_estimate}
                onChange={handleChange}
                placeholder="e.g., 1200.50"
                disabled={isSubmitting}
                hasError={!!errors.value_estimate}
              />
              {errors.value_estimate && <p className="text-xs text-accentRed mt-1">{errors.value_estimate}</p>}
            </div>
            <div>
              <label htmlFor="classroom_id" className="block text-sm font-medium text-neutralDark mb-1">
                Assign to Classroom
              </label>
              <Select
                id="classroom_id"
                name="classroom_id"
                value={formData.classroom_id}
                onChange={handleChange}
                options={classroomOptions}
                disabled={isSubmitting || classrooms.length === 0}
                hasError={!!errors.classroom_id}
              />
              {errors.classroom_id && <p className="text-xs text-accentRed mt-1">{errors.classroom_id}</p>}
            </div>
        </div>
        <div>
            <label htmlFor="image_url" className="block text-sm font-medium text-neutralDark mb-1">
            Image URL
            </label>
            <Input
            id="image_url"
            name="image_url"
            type="url"
            value={formData.image_url}
            onChange={handleChange}
            placeholder="https://example.com/image.png"
            disabled={isSubmitting}
            hasError={!!errors.image_url}
            />
            {errors.image_url && <p className="text-xs text-accentRed mt-1">{errors.image_url}</p>}
        </div>
      </form>
    }
    </Modal>
  );
};

export default CreateAssetModal;
