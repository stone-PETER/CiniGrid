import React, { useState } from "react";
import api from "../services/api";

interface CreateRequirementModalProps {
  isOpen: boolean;
  projectId: string;
  onClose: () => void;
  onSuccess: () => void;
  initialPrompt?: string; // Pre-fill prompt from script analysis
}

interface RequirementFormData {
  prompt: string;
  notes: string;
  priority: "Low" | "Medium" | "High";
  budget: {
    max: string;
    currency: string;
    notes: string;
  };
  constraints: {
    maxDistance: string;
    requiredAmenities: string[];
    shootDates: {
      start: string;
      end: string;
    };
    crewSize: string;
  };
}

const CreateRequirementModal: React.FC<CreateRequirementModalProps> = ({
  isOpen,
  projectId,
  onClose,
  onSuccess,
  initialPrompt = "", // Default to empty string
}) => {
  const [formData, setFormData] = useState<RequirementFormData>({
    prompt: "",
    notes: "",
    priority: "Medium",
    budget: {
      max: "",
      currency: "USD",
      notes: "",
    },
    constraints: {
      maxDistance: "",
      requiredAmenities: [],
      shootDates: {
        start: "",
        end: "",
      },
      crewSize: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-fill prompt from script analysis when modal opens
  React.useEffect(() => {
    if (isOpen && initialPrompt) {
      setFormData((prev) => ({
        ...prev,
        prompt: initialPrompt,
      }));
    }
  }, [isOpen, initialPrompt]);

  const amenityOptions = [
    { value: "parking", label: "Parking" },
    { value: "wifi", label: "WiFi" },
    { value: "power", label: "Power" },
    { value: "kitchen", label: "Kitchen" },
    { value: "greenRoom", label: "Green Room" },
    { value: "bathroom", label: "Bathroom" },
    { value: "loadingDock", label: "Loading Dock" },
    { value: "cateringSpace", label: "Catering Space" },
  ];

  const handleAmenityToggle = (amenity: string) => {
    setFormData((prev) => ({
      ...prev,
      constraints: {
        ...prev.constraints,
        requiredAmenities: prev.constraints.requiredAmenities.includes(amenity)
          ? prev.constraints.requiredAmenities.filter((a) => a !== amenity)
          : [...prev.constraints.requiredAmenities, amenity],
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!formData.prompt.trim()) {
      setError("Location description/prompt is required");
      return;
    }

    setLoading(true);

    try {
      // Prepare request body
      interface RequestBody {
        projectId: string;
        prompt: string;
        notes: string;
        priority: string;
        status: string;
        budget?: {
          max: number;
          currency: string;
          notes?: string;
        };
        constraints?: {
          maxDistance?: number;
          requiredAmenities?: string[];
          shootDates?: {
            start: Date;
            end?: Date;
          };
          crewSize?: number;
        };
      }

      const requestBody: RequestBody = {
        projectId,
        prompt: formData.prompt.trim(),
        notes: formData.notes.trim(),
        priority: formData.priority,
        status: "Active",
      };

      // Add budget if provided
      if (formData.budget.max) {
        requestBody.budget = {
          max: parseFloat(formData.budget.max),
          currency: formData.budget.currency,
        };
        if (formData.budget.notes) {
          requestBody.budget.notes = formData.budget.notes;
        }
      }

      // Add constraints if any provided
      const hasConstraints =
        formData.constraints.maxDistance ||
        formData.constraints.requiredAmenities.length > 0 ||
        formData.constraints.shootDates.start ||
        formData.constraints.crewSize;

      if (hasConstraints) {
        requestBody.constraints = {};

        if (formData.constraints.maxDistance) {
          requestBody.constraints.maxDistance = parseFloat(
            formData.constraints.maxDistance
          );
        }

        if (formData.constraints.requiredAmenities.length > 0) {
          requestBody.constraints.requiredAmenities =
            formData.constraints.requiredAmenities;
        }

        if (formData.constraints.shootDates.start) {
          requestBody.constraints.shootDates = {
            start: new Date(formData.constraints.shootDates.start),
          };
          if (formData.constraints.shootDates.end) {
            requestBody.constraints.shootDates.end = new Date(
              formData.constraints.shootDates.end
            );
          }
        }

        if (formData.constraints.crewSize) {
          requestBody.constraints.crewSize = parseInt(
            formData.constraints.crewSize
          );
        }
      }

      // Make API call using the api service (includes auth token automatically)
      const response = await api.post("/locations/requirements", requestBody);

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to create requirement");
      }

      // Success!
      onSuccess();
      onClose();

      // Reset form
      setFormData({
        prompt: "",
        notes: "",
        priority: "Medium",
        budget: {
          max: "",
          currency: "USD",
          notes: "",
        },
        constraints: {
          maxDistance: "",
          requiredAmenities: [],
          shootDates: {
            start: "",
            end: "",
          },
          crewSize: "",
        },
      });
    } catch (err) {
      console.error("Error creating requirement:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create requirement"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">
            Create Location Requirement
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            disabled={loading}
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Location Description/Prompt */}
          <div>
            <label
              htmlFor="prompt"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Location Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="prompt"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Victorian mansion with large garden, ornate interior"
              value={formData.prompt}
              onChange={(e) =>
                setFormData({ ...formData, prompt: e.target.value })
              }
              required
              disabled={loading}
            />
            <p className="mt-1 text-sm text-gray-500">
              Describe the type of location you're looking for
            </p>
          </div>

          {/* Notes */}
          <div>
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Additional Notes
            </label>
            <textarea
              id="notes"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Need at least 5 bedrooms, must have period details"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              disabled={loading}
            />
          </div>

          {/* Priority */}
          <div>
            <label
              htmlFor="priority"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Priority
            </label>
            <select
              id="priority"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={formData.priority}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as "Low" | "Medium" | "High",
                })
              }
              disabled={loading}
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Budget Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Budget (Optional)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="budgetMax"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Maximum Budget
                </label>
                <input
                  id="budgetMax"
                  type="number"
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="5000"
                  value={formData.budget.max}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget: { ...formData.budget, max: e.target.value },
                    })
                  }
                  disabled={loading}
                />
              </div>
              <div>
                <label
                  htmlFor="budgetCurrency"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Currency
                </label>
                <select
                  id="budgetCurrency"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.budget.currency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      budget: { ...formData.budget, currency: e.target.value },
                    })
                  }
                  disabled={loading}
                >
                  <option value="USD">USD</option>
                  <option value="CAD">CAD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label
                htmlFor="budgetNotes"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Budget Notes
              </label>
              <input
                id="budgetNotes"
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., per day, negotiable"
                value={formData.budget.notes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    budget: { ...formData.budget, notes: e.target.value },
                  })
                }
                disabled={loading}
              />
            </div>
          </div>

          {/* Constraints Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Constraints (Optional)
            </h3>

            <div className="space-y-4">
              {/* Max Distance */}
              <div>
                <label
                  htmlFor="maxDistance"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Maximum Distance (miles)
                </label>
                <input
                  id="maxDistance"
                  type="number"
                  min="0"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="50"
                  value={formData.constraints.maxDistance}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      constraints: {
                        ...formData.constraints,
                        maxDistance: e.target.value,
                      },
                    })
                  }
                  disabled={loading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum distance from main production location
                </p>
              </div>

              {/* Required Amenities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Required Amenities
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {amenityOptions.map((amenity) => (
                    <label
                      key={amenity.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.constraints.requiredAmenities.includes(
                          amenity.value
                        )}
                        onChange={() => handleAmenityToggle(amenity.value)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        disabled={loading}
                      />
                      <span className="text-sm text-gray-700">
                        {amenity.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Shoot Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="shootDateStart"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Shoot Start Date
                  </label>
                  <input
                    id="shootDateStart"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.constraints.shootDates.start}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        constraints: {
                          ...formData.constraints,
                          shootDates: {
                            ...formData.constraints.shootDates,
                            start: e.target.value,
                          },
                        },
                      })
                    }
                    disabled={loading}
                  />
                </div>
                <div>
                  <label
                    htmlFor="shootDateEnd"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Shoot End Date
                  </label>
                  <input
                    id="shootDateEnd"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.constraints.shootDates.end}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        constraints: {
                          ...formData.constraints,
                          shootDates: {
                            ...formData.constraints.shootDates,
                            end: e.target.value,
                          },
                        },
                      })
                    }
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Crew Size */}
              <div>
                <label
                  htmlFor="crewSize"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Crew Size
                </label>
                <input
                  id="crewSize"
                  type="number"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="25"
                  value={formData.constraints.crewSize}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      constraints: {
                        ...formData.constraints,
                        crewSize: e.target.value,
                      },
                    })
                  }
                  disabled={loading}
                />
                <p className="mt-1 text-sm text-gray-500">
                  Number of crew members to accommodate
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? "Creating..." : "Create Requirement"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateRequirementModal;
