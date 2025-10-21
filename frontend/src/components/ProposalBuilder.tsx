import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Plus, X } from 'lucide-react';

interface Section {
  id: string;
  title: string;
  description?: string;
  pageTarget?: number;
  order: number;
}

interface ProposalFormData {
  title: string;
  client: string;
  dueDate: string;
  description?: string;
  sections: Section[];
}

interface ProposalBuilderProps {
  onComplete: (data: ProposalFormData) => void;
  onCancel: () => void;
}

const COMMON_SECTIONS = [
  { title: 'Executive Summary', description: 'High-level overview of the proposal' },
  { title: 'Technical Approach', description: 'Detailed methodology and approach' },
  { title: 'Safety Plan', description: 'Safety protocols and procedures' },
  { title: 'Past Performance', description: 'Relevant project experience' },
  { title: 'Qualifications', description: 'Team qualifications and expertise' },
  { title: 'Project Schedule', description: 'Timeline and milestones' },
  { title: 'Budget & Pricing', description: 'Cost breakdown and pricing' },
  { title: 'Quality Control', description: 'Quality assurance processes' },
  { title: 'Risk Management', description: 'Risk identification and mitigation' },
  { title: 'Management Plan', description: 'Project management approach' },
];

export const ProposalBuilder: React.FC<ProposalBuilderProps> = ({ onComplete, onCancel }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ProposalFormData>({
    title: '',
    client: '',
    dueDate: '',
    description: '',
    sections: [],
  });

  const totalSteps = 3;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAddSection = (section: { title: string; description?: string }) => {
    const newSection: Section = {
      id: `section-${Date.now()}-${Math.random()}`,
      title: section.title,
      description: section.description,
      pageTarget: 0,
      order: formData.sections.length,
    };
    setFormData({
      ...formData,
      sections: [...formData.sections, newSection],
    });
  };

  const handleRemoveSection = (id: string) => {
    const updatedSections = formData.sections
      .filter(s => s.id !== id)
      .map((s, index) => ({ ...s, order: index }));
    setFormData({
      ...formData,
      sections: updatedSections,
    });
  };

  const handleSectionChange = (id: string, field: keyof Section, value: any) => {
    const updatedSections = formData.sections.map(s =>
      s.id === id ? { ...s, [field]: value } : s
    );
    setFormData({
      ...formData,
      sections: updatedSections,
    });
  };

  const handleAddCustomSection = () => {
    const title = prompt('Enter section title:');
    if (title) {
      handleAddSection({ title });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.title.trim() !== '' && formData.client.trim() !== '';
      case 2:
        return formData.sections.length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500">
            {currentStep === 1 && 'Basic Information'}
            {currentStep === 2 && 'Select Sections'}
            {currentStep === 3 && 'Configure Sections'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Basic Information */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Let's start with the basics</h2>
          <p className="text-gray-600">
            Provide some basic information about your proposal to get started.
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proposal Title *
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Highway 101 Reconstruction Project"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Client/Organization *
            </label>
            <input
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., State Department of Transportation"
              value={formData.client}
              onChange={(e) => setFormData({ ...formData, client: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Due Date
            </label>
            <input
              type="date"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Brief description of the proposal..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Step 2: Select Sections */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Choose your proposal sections</h2>
          <p className="text-gray-600">
            Select from common sections or add your own custom sections.
          </p>

          {/* Selected Sections */}
          {formData.sections.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-900 mb-3">Selected Sections ({formData.sections.length})</h3>
              <div className="space-y-2">
                {formData.sections.map((section) => (
                  <div
                    key={section.id}
                    className="flex items-center justify-between bg-white px-3 py-2 rounded border border-blue-200"
                  >
                    <span className="font-medium text-gray-900">{section.title}</span>
                    <button
                      onClick={() => handleRemoveSection(section.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Common Sections Grid */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Common Sections</h3>
            <div className="grid grid-cols-2 gap-3">
              {COMMON_SECTIONS.map((section, index) => {
                const isSelected = formData.sections.some(s => s.title === section.title);
                return (
                  <button
                    key={index}
                    onClick={() => !isSelected && handleAddSection(section)}
                    disabled={isSelected}
                    className={`text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-green-500 bg-green-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                    }`}
                  >
                    <div className="font-semibold text-gray-900">{section.title}</div>
                    <div className="text-sm text-gray-600 mt-1">{section.description}</div>
                    {isSelected && (
                      <div className="text-xs text-green-600 font-medium mt-2">✓ Added</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Section Button */}
          <button
            onClick={handleAddCustomSection}
            className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            Add Custom Section
          </button>
        </div>
      )}

      {/* Step 3: Configure Sections */}
      {currentStep === 3 && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Configure section details</h2>
          <p className="text-gray-600">
            Set page targets and descriptions for each section. You'll be able to reorder them next.
          </p>

          <div className="space-y-4">
            {formData.sections.map((section, index) => (
              <div key={section.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </div>
                  <div className="flex-grow space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Section Title
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={section.title}
                        onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description (Optional)
                      </label>
                      <input
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Brief description of this section..."
                        value={section.description || ''}
                        onChange={(e) => handleSectionChange(section.id, 'description', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Page Target
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-32 px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0"
                        value={section.pageTarget || ''}
                        onChange={(e) => handleSectionChange(section.id, 'pageTarget', parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 pt-6 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 hover:text-gray-900"
        >
          Cancel
        </button>

        <div className="flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
            >
              <ChevronLeft size={20} />
              Back
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className={`px-6 py-2 rounded-lg flex items-center gap-2 ${
              canProceed()
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {currentStep === totalSteps ? 'Create Proposal' : 'Next'}
            {currentStep < totalSteps && <ChevronRight size={20} />}
          </button>
        </div>
      </div>
    </div>
  );
};
