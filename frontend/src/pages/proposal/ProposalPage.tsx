/**
 * Proposal Builder Page - Create and manage proposals with content block linking
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Download, FileText, Loader2, MessageSquare, Plus, Edit3 } from 'lucide-react';
import { proposalService } from '../../services/proposalService';
import { ContentBlockBrowser } from '../../components/ContentBlockBrowser';
import { LinkedContentItem } from '../../components/LinkedContentItem';
import { ContentRefinementModal } from '../../components/ContentRefinementModal';
import { RichTextEditor } from '../../components/common/RichTextEditor';
import type { Proposal, ProposalSection, ProposalContent, ContentBlock } from '../../types';

export const ProposalPage = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingSection, setExportingSection] = useState<number | null>(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [currentExportSection, setCurrentExportSection] = useState<number | null>(null);
  const [formattingInstructions, setFormattingInstructions] = useState('');

  // Content Block Browser state
  const [showBlockBrowser, setShowBlockBrowser] = useState(false);
  const [currentSection, setCurrentSection] = useState<ProposalSection | null>(null);

  // Content Refinement state
  const [showRefinementModal, setShowRefinementModal] = useState(false);
  const [contentToRefine, setContentToRefine] = useState<ProposalContent | null>(null);

  // Content Editor state
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [contentToEdit, setContentToEdit] = useState<ProposalContent | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [editedTitle, setEditedTitle] = useState('');

  // Load proposal and sections
  useEffect(() => {
    if (proposalId) {
      loadProposal(parseInt(proposalId));
    }
  }, [proposalId]);

  const loadProposal = async (id: number) => {
    try {
      setLoading(true);
      const [proposalData, sectionsData] = await Promise.all([
        proposalService.getProposal(id),
        proposalService.getSections(id),
      ]);
      setProposal(proposalData.data);
      setSections(sectionsData.data);
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle adding content block to section
  const handleAddContentBlock = (section: ProposalSection) => {
    setCurrentSection(section);
    setShowBlockBrowser(true);
  };

  const handleSelectBlock = async (block: ContentBlock) => {
    if (!proposalId || !currentSection) return;

    try {
      // Determine the next order number
      const maxOrder = currentSection.contents
        ? Math.max(...currentSection.contents.map((c) => c.order), 0)
        : 0;

      // Add content to section
      await proposalService.addContentToSection(
        parseInt(proposalId),
        currentSection.id,
        {
          source_block_id: block.id,
          content: block.content,
          title: block.title,
          order: maxOrder + 1,
          is_custom: false,
        }
      );

      // Reload sections to show the new content
      await loadProposal(parseInt(proposalId));
      setShowBlockBrowser(false);
      setCurrentSection(null);
    } catch (error) {
      console.error('Error adding content block:', error);
      alert('Failed to add content block. Please try again.');
    }
  };

  // Handle refining content with Claude
  const handleRefineContent = (content: ProposalContent) => {
    setContentToRefine(content);
    setShowRefinementModal(true);
  };

  const handleApplyRefinedContent = async (refinedContent: string, customizationNotes: string) => {
    if (!proposalId || !contentToRefine) return;

    try {
      // Find the section for this content
      const section = sections.find((s) => s.contents?.some((c) => c.id === contentToRefine.id));
      if (!section) return;

      // Update the content
      await proposalService.updateSectionContent(
        parseInt(proposalId),
        section.id,
        contentToRefine.id,
        {
          content: refinedContent,
          customization_notes: customizationNotes,
        }
      );

      // Reload sections
      await loadProposal(parseInt(proposalId));
      setShowRefinementModal(false);
      setContentToRefine(null);
    } catch (error) {
      console.error('Error applying refined content:', error);
      alert('Failed to apply refined content. Please try again.');
    }
  };

  // Handle editing content
  const handleEditContent = (content: ProposalContent) => {
    setContentToEdit(content);
    setEditedContent(content.content);
    setEditedTitle(content.title || '');
    setShowContentEditor(true);
  };

  const handleSaveEditedContent = async () => {
    if (!proposalId || !contentToEdit) return;

    try {
      // Find the section for this content
      const section = sections.find((s) => s.contents?.some((c) => c.id === contentToEdit.id));
      if (!section) return;

      // Update the content
      await proposalService.updateSectionContent(
        parseInt(proposalId),
        section.id,
        contentToEdit.id,
        {
          content: editedContent,
          title: editedTitle,
        }
      );

      // Reload sections
      await loadProposal(parseInt(proposalId));
      setShowContentEditor(false);
      setContentToEdit(null);
      setEditedContent('');
      setEditedTitle('');
    } catch (error) {
      console.error('Error saving edited content:', error);
      alert('Failed to save edited content. Please try again.');
    }
  };

  // Handle deleting content
  const handleDeleteContent = async (contentId: number) => {
    if (!proposalId) return;

    try {
      // Find the section for this content
      const section = sections.find((s) => s.contents?.some((c) => c.id === contentId));
      if (!section) return;

      await proposalService.deleteSectionContent(parseInt(proposalId), section.id, contentId);

      // Reload sections
      await loadProposal(parseInt(proposalId));
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content. Please try again.');
    }
  };

  // Export functions
  const handleExportSection = async (sectionId: number, sectionTitle: string) => {
    if (!proposalId) return;

    // Open format modal to get Claude formatting instructions
    setCurrentExportSection(sectionId);
    setShowFormatModal(true);
  };

  const executeExport = async () => {
    if (!proposalId || currentExportSection === null) return;

    try {
      setExportingSection(currentExportSection);
      setShowFormatModal(false);

      const response = await proposalService.exportSection(
        parseInt(proposalId),
        currentExportSection,
        formattingInstructions || undefined
      );

      // Get section title for filename
      const section = sections.find((s) => s.id === currentExportSection);
      const filename = section
        ? `${section.title.replace(/[^a-z0-9]/gi, '_')}.docx`
        : `section_${currentExportSection}.docx`;

      // Create download link
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      // Reset state
      setFormattingInstructions('');
      setCurrentExportSection(null);
    } catch (error) {
      console.error('Error exporting section:', error);
      alert('Failed to export section. Please try again.');
    } finally {
      setExportingSection(null);
    }
  };

  const getSectionStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Proposal Not Found</h2>
          <p className="text-gray-600">The requested proposal could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{proposal.name}</h1>
          {proposal.client_name && (
            <p className="text-lg text-gray-600">Client: {proposal.client_name}</p>
          )}
          {proposal.rfp_deadline && (
            <p className="text-sm text-gray-500">
              Deadline: {new Date(proposal.rfp_deadline).toLocaleDateString()}
            </p>
          )}
        </div>

        {/* Sections */}
        {sections.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Sections Yet</h3>
            <p className="text-gray-600">Start building your proposal by adding sections.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sections.map((section) => (
              <div
                key={section.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                {/* Section Header */}
                <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-gray-900 mb-1">
                        {section.title}
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getSectionStatusColor(
                            section.status
                          )}`}
                        >
                          {section.status.replace('_', ' ').toUpperCase()}
                        </span>
                        {section.section_type && (
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                            {section.section_type.replace('_', ' ')}
                          </span>
                        )}
                        {section.page_target_min && section.page_target_max && (
                          <span>
                            Target: {section.page_target_min}-{section.page_target_max} pages
                          </span>
                        )}
                        {section.current_pages !== undefined && (
                          <span>Current: {section.current_pages} pages</span>
                        )}
                      </div>
                    </div>

                    {/* Export Button */}
                    <button
                      onClick={() => handleExportSection(section.id, section.title)}
                      disabled={exportingSection === section.id}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {exportingSection === section.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Exporting...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Export to Word</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Section Content */}
                <div className="p-6">
                  {section.contents && section.contents.length > 0 ? (
                    <div className="space-y-4 mb-4">
                      {section.contents.map((content) => (
                        <LinkedContentItem
                          key={content.id}
                          content={content}
                          onEdit={handleEditContent}
                          onRefine={handleRefineContent}
                          onDelete={handleDeleteContent}
                          isCustom={content.is_custom}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500 mb-4">
                      <p>No content added to this section yet.</p>
                      <p className="text-sm mt-1">
                        Click "Add Content Block" below to link content from your repository.
                      </p>
                    </div>
                  )}

                  {/* Add Content Block Button */}
                  <button
                    onClick={() => handleAddContentBlock(section)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-700"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="font-medium">Add Content Block from Repository</span>
                  </button>
                </div>

                {/* Section Notes */}
                {section.notes && (
                  <div className="bg-yellow-50 border-t border-yellow-100 px-6 py-3">
                    <div className="flex items-start gap-2">
                      <MessageSquare className="w-4 h-4 text-yellow-600 mt-0.5" />
                      <p className="text-sm text-yellow-800">{section.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Content Block Browser Modal */}
        <ContentBlockBrowser
          isOpen={showBlockBrowser}
          onClose={() => {
            setShowBlockBrowser(false);
            setCurrentSection(null);
          }}
          onSelectBlock={handleSelectBlock}
          sectionType={currentSection?.section_type}
          title="Select Content Block to Add"
        />

        {/* Content Refinement Modal */}
        {contentToRefine && (
          <ContentRefinementModal
            isOpen={showRefinementModal}
            onClose={() => {
              setShowRefinementModal(false);
              setContentToRefine(null);
            }}
            content={contentToRefine}
            sectionType={
              sections.find((s) => s.contents?.some((c) => c.id === contentToRefine.id))
                ?.section_type
            }
            onApply={handleApplyRefinedContent}
          />
        )}

        {/* Content Editor Modal */}
        {showContentEditor && contentToEdit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-6 h-6 text-blue-600" />
                    <h3 className="text-xl font-semibold text-gray-900">Edit Content</h3>
                  </div>
                  <button
                    onClick={() => {
                      setShowContentEditor(false);
                      setContentToEdit(null);
                      setEditedContent('');
                      setEditedTitle('');
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MessageSquare className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Title (Optional)
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      placeholder="Content title..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Content
                    </label>
                    <RichTextEditor
                      content={editedContent}
                      onChange={setEditedContent}
                      placeholder="Edit your content here..."
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowContentEditor(false);
                      setContentToEdit(null);
                      setEditedContent('');
                      setEditedTitle('');
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEditedContent}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Format Modal */}
        {showFormatModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  Export Formatting Instructions
                </h3>
                <p className="text-gray-600 mb-4">
                  Optionally, provide instructions for Claude to format the exported document.
                  Leave blank for default formatting.
                </p>
                <textarea
                  value={formattingInstructions}
                  onChange={(e) => setFormattingInstructions(e.target.value)}
                  placeholder="Example: Use 12pt Times New Roman, 1.5 line spacing, add page numbers..."
                  className="w-full h-32 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    onClick={() => {
                      setShowFormatModal(false);
                      setFormattingInstructions('');
                      setCurrentExportSection(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeExport}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Export
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
