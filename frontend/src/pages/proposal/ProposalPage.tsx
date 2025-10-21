import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Calendar, Trash2, Eye } from 'lucide-react';
import { ProposalBuilder } from '../../components/ProposalBuilder';
import { DraggableSectionList } from '../../components/DraggableSectionList';
import { EditSectionModal } from '../../components/EditSectionModal';
import { SectionContentModal } from '../../components/SectionContentModal';
import { proposalService } from '../../services/proposalService';
import type { Proposal, ProposalSection } from '../../types';

type ViewMode = 'list' | 'builder' | 'editor';

interface ProposalFormData {
  title: string;
  client: string;
  dueDate: string;
  description?: string;
  sections: Array<{
    id: string;
    title: string;
    description?: string;
    pageTarget?: number;
    order: number;
  }>;
}

export const ProposalPage = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [editingSection, setEditingSection] = useState<ProposalSection | null>(null);
  const [isEditSectionModalOpen, setIsEditSectionModalOpen] = useState(false);
  const [contentSection, setContentSection] = useState<ProposalSection | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [isAddingSectionModal, setIsAddingSectionModal] = useState(false);
  const queryClient = useQueryClient();

  // Fetch proposals
  const { data: proposalsData, isLoading } = useQuery({
    queryKey: ['proposals'],
    queryFn: async () => {
      const response = await proposalService.getProposals({ archived: false });
      return response;
    },
  });

  // Fetch sections for selected proposal
  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['sections', selectedProposal?.id],
    queryFn: async () => {
      if (!selectedProposal) return [];
      const response = await proposalService.getSections(selectedProposal.id);
      return response;
    },
    enabled: !!selectedProposal,
  });

  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: async (formData: ProposalFormData) => {
      // First create the proposal
      const proposalResponse = await proposalService.createProposal({
        name: formData.title,
        client_name: formData.client,
        rfp_deadline: formData.dueDate || undefined,
        notes: formData.description,
      });

      const proposal = proposalResponse;

      // Then create all sections
      for (const section of formData.sections) {
        await proposalService.createSection(proposal.id, {
          title: section.title,
          order: section.order,
          page_target_min: section.pageTarget,
          notes: section.description,
        });
      }

      return proposal;
    },
    onSuccess: (proposal) => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      setSelectedProposal(proposal);
      setViewMode('editor');
    },
  });

  // Delete proposal mutation
  const deleteProposalMutation = useMutation({
    mutationFn: (id: number) => proposalService.deleteProposal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });

  // Reorder sections mutation
  const reorderSectionsMutation = useMutation({
    mutationFn: async (reorderedSections: ProposalSection[]) => {
      if (!selectedProposal) return;
      const sections = reorderedSections.map(s => ({ id: s.id, order: s.order }));
      return proposalService.reorderSections(selectedProposal.id, sections);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', selectedProposal?.id] });
    },
  });

  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: (sectionId: number) => {
      if (!selectedProposal) throw new Error('No proposal selected');
      return proposalService.deleteSection(selectedProposal.id, sectionId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', selectedProposal?.id] });
    },
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: ({ sectionId, data }: { sectionId: number; data: Partial<ProposalSection> }) => {
      if (!selectedProposal) throw new Error('No proposal selected');
      return proposalService.updateSection(selectedProposal.id, sectionId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', selectedProposal?.id] });
    },
  });

  // Add content to section mutation
  const addContentMutation = useMutation({
    mutationFn: ({ sectionId, content }: { sectionId: number; content: string }) => {
      if (!selectedProposal) throw new Error('No proposal selected');
      return proposalService.addContentToSection(selectedProposal.id, sectionId, {
        content,
        title: '',
        order: 0,
        is_custom: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', selectedProposal?.id] });
    },
  });

  // Create new section mutation
  const createSectionMutation = useMutation({
    mutationFn: (data: Partial<ProposalSection>) => {
      if (!selectedProposal) throw new Error('No proposal selected');
      const maxOrder = sections?.reduce((max: number, s: ProposalSection) => Math.max(max, s.order), -1) ?? -1;
      return proposalService.createSection(selectedProposal.id, {
        ...data,
        order: maxOrder + 1,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sections', selectedProposal?.id] });
    },
  });

  const handleProposalComplete = (formData: ProposalFormData) => {
    createProposalMutation.mutate(formData);
  };

  const handleViewProposal = (proposal: Proposal) => {
    setSelectedProposal(proposal);
    setViewMode('editor');
  };

  const handleBackToList = () => {
    setSelectedProposal(null);
    setViewMode('list');
  };

  const handleReorder = (reorderedSections: ProposalSection[]) => {
    reorderSectionsMutation.mutate(reorderedSections);
  };

  const handleEditSection = (section: ProposalSection) => {
    setEditingSection(section);
    setIsEditSectionModalOpen(true);
  };

  const handleSaveSection = (data: Partial<ProposalSection>) => {
    if (editingSection) {
      updateSectionMutation.mutate({
        sectionId: editingSection.id,
        data,
      });
    }
  };

  const handleDeleteSection = (sectionId: number) => {
    if (confirm('Are you sure you want to delete this section?')) {
      deleteSectionMutation.mutate(sectionId);
    }
  };

  const handleAddContent = (sectionId: number) => {
    const section = sections?.find((s: ProposalSection) => s.id === sectionId);
    if (section) {
      setContentSection(section);
      setIsContentModalOpen(true);
    }
  };

  const handleSaveContent = (content: string) => {
    if (contentSection) {
      addContentMutation.mutate({
        sectionId: contentSection.id,
        content,
      });
    }
  };

  const handleAddNewSection = () => {
    setEditingSection({
      id: 0,
      proposal_id: selectedProposal?.id || 0,
      title: '',
      order: 0,
      status: 'pending',
      created_at: new Date().toISOString(),
    } as ProposalSection);
    setIsAddingSectionModal(true);
  };

  const handleSaveNewSection = (data: Partial<ProposalSection>) => {
    createSectionMutation.mutate(data);
  };

  const formatDate = (date?: string | Date | null) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };

  // Builder View
  if (viewMode === 'builder') {
    return (
      <div className="h-full overflow-auto bg-gray-50">
        <ProposalBuilder
          onComplete={handleProposalComplete}
          onCancel={() => setViewMode('list')}
        />
      </div>
    );
  }

  // Editor View
  if (viewMode === 'editor' && selectedProposal) {
    return (
      <div className="h-full overflow-auto bg-gray-50">
        <div className="max-w-6xl mx-auto p-6">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={handleBackToList}
              className="text-blue-600 hover:text-blue-800 mb-4 flex items-center gap-2"
            >
              ← Back to Proposals
            </button>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{selectedProposal.name}</h1>
              <div className="flex gap-6 text-sm text-gray-600">
                {selectedProposal.client_name && (
                  <span>Client: {selectedProposal.client_name}</span>
                )}
                {selectedProposal.rfp_deadline && (
                  <span className="flex items-center gap-1">
                    <Calendar size={14} />
                    Due: {formatDate(selectedProposal.rfp_deadline)}
                  </span>
                )}
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  selectedProposal.status === 'completed' ? 'bg-green-100 text-green-800' :
                  selectedProposal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {selectedProposal.status}
                </span>
              </div>
              {selectedProposal.notes && (
                <p className="mt-3 text-gray-700">{selectedProposal.notes}</p>
              )}
            </div>
          </div>

          {/* Sections */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Proposal Sections</h2>
              <button
                onClick={handleAddNewSection}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus size={20} />
                Add Section
              </button>
            </div>

            {sectionsLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-2">Loading sections...</p>
              </div>
            ) : (
              <DraggableSectionList
                sections={sections || []}
                onReorder={handleReorder}
                onEdit={handleEditSection}
                onDelete={handleDeleteSection}
                onAddContent={handleAddContent}
              />
            )}
          </div>
        </div>

        {/* Modals */}
        <EditSectionModal
          isOpen={isEditSectionModalOpen}
          section={editingSection}
          onSave={handleSaveSection}
          onClose={() => {
            setIsEditSectionModalOpen(false);
            setEditingSection(null);
          }}
        />

        <EditSectionModal
          isOpen={isAddingSectionModal}
          section={editingSection}
          onSave={(data) => {
            handleSaveNewSection(data);
            setIsAddingSectionModal(false);
            setEditingSection(null);
          }}
          onClose={() => {
            setIsAddingSectionModal(false);
            setEditingSection(null);
          }}
        />

        <SectionContentModal
          isOpen={isContentModalOpen}
          sectionTitle={contentSection?.title || ''}
          onSave={handleSaveContent}
          onClose={() => {
            setIsContentModalOpen(false);
            setContentSection(null);
          }}
        />
      </div>
    );
  }

  // List View
  return (
    <div className="h-full overflow-auto bg-gray-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Proposals</h1>
            <p className="text-gray-600 mt-1">Manage and build your proposals</p>
          </div>
          <button
            onClick={() => setViewMode('builder')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus size={20} />
            New Proposal
          </button>
        </div>

        {/* Proposals List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-2">Loading proposals...</p>
          </div>
        ) : proposalsData?.items && proposalsData.items.length > 0 ? (
          <div className="grid gap-4">
            {proposalsData.items.map((proposal: Proposal) => (
              <div
                key={proposal.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-grow">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {proposal.name}
                    </h3>
                    <div className="flex gap-4 text-sm text-gray-600 mb-2">
                      {proposal.client_name && (
                        <span>Client: {proposal.client_name}</span>
                      )}
                      {proposal.rfp_deadline && (
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Due: {formatDate(proposal.rfp_deadline)}
                        </span>
                      )}
                    </div>
                    {proposal.notes && (
                      <p className="text-gray-700 text-sm">{proposal.notes}</p>
                    )}
                    <div className="flex items-center gap-2 mt-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        proposal.status === 'completed' ? 'bg-green-100 text-green-800' :
                        proposal.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {proposal.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        Updated {formatDate(proposal.updated_at)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleViewProposal(proposal)}
                      className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="View Proposal"
                    >
                      <Eye size={20} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this proposal?')) {
                          deleteProposalMutation.mutate(proposal.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                      title="Delete Proposal"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-gray-300">
            <FileText size={48} className="mx-auto text-gray-400 mb-3" />
            <p className="text-gray-600 font-medium mb-2">No proposals yet</p>
            <p className="text-sm text-gray-500 mb-4">
              Get started by creating your first proposal
            </p>
            <button
              onClick={() => setViewMode('builder')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
            >
              <Plus size={20} />
              Create Proposal
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
