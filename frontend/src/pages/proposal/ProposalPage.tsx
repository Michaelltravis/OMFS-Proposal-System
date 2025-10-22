/**
 * Proposal Builder Page - Create and manage proposals
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Download, FileText, Loader2, MessageSquare, ChevronDown, ChevronUp, Plus, Library, Edit2, Trash2, GripVertical } from 'lucide-react';
import { proposalService } from '../../services/proposalService';
import { contentService } from '../../services/contentService';
import { ContentSearchModal } from '../../components/ContentSearchModal';
import { SectionContentModal } from '../../components/SectionContentModal';
import { RichTextEditor } from '../../components/common/RichTextEditor';
import type { Proposal, ProposalSection } from '../../types';
import { sanitizeHtml } from '../../utils/sanitizer';

export const ProposalPage = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingSection, setExportingSection] = useState<number | null>(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [currentExportSection, setCurrentExportSection] = useState<number | null>(null);
  const [formattingInstructions, setFormattingInstructions] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [showContentSearch, setShowContentSearch] = useState(false);
  const [currentSection, setCurrentSection] = useState<number | null>(null);
  const [addingContent, setAddingContent] = useState(false);
  const [editingContent, setEditingContent] = useState<{ sectionId: number; contentId: number; content: string; title?: string } | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editMode, setEditMode] = useState<'visual' | 'html'>('visual');
  const [showSectionContentModal, setShowSectionContentModal] = useState(false);
  const [creatingContentForSection, setCreatingContentForSection] = useState<ProposalSection | null>(null);

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
      console.log('Loaded sections data:', sectionsData);
      console.log('Section 1 contents:', sectionsData[0]?.contents);
      setProposal(proposalData);
      setSections(sectionsData);
      // Expand all sections by default
      setExpandedSections(new Set(sectionsData.map((s: ProposalSection) => s.id)));
    } catch (error) {
      console.error('Error loading proposal:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (sectionId: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const openContentSearch = (sectionId: number) => {
    setCurrentSection(sectionId);
    setShowContentSearch(true);
  };

  const handleAddContent = async (contentBlockIds: number[]) => {
    console.log('handleAddContent called with:', { contentBlockIds, proposalId, currentSection });

    if (!proposalId || !currentSection) {
      console.log('Early return - missing proposalId or currentSection');
      return;
    }

    try {
      setAddingContent(true);
      console.log(`Adding ${contentBlockIds.length} content blocks to section ${currentSection}`);

      // Add each selected content block to the section
      for (const blockId of contentBlockIds) {
        console.log(`Fetching content block ${blockId}...`);
        // Get the content block details
        const block = await contentService.getContentBlock(blockId);
        console.log('Fetched block:', { id: block.id, title: block.title });

        // Add to section - order is based on current content count
        const currentSectionData = sections.find(s => s.id === currentSection);
        const order = (currentSectionData?.contents?.length || 0) + 1;

        console.log(`Adding block ${blockId} to section ${currentSection} with order ${order}`);
        await proposalService.addContentToSection(
          parseInt(proposalId),
          currentSection,
          {
            source_block_id: blockId,
            content: block.content,
            title: block.title,
            order,
            is_custom: false,
          }
        );
        console.log(`Successfully added block ${blockId}`);
      }

      console.log('All blocks added, reloading proposal...');
      // Reload the proposal to show updated content
      await loadProposal(parseInt(proposalId));
      console.log('Proposal reloaded successfully');
    } catch (error) {
      console.error('Error adding content:', error);
      alert('Failed to add content. Please try again.');
    } finally {
      setAddingContent(false);
    }
  };

  const handleDeleteContent = async (sectionId: number, contentId: number) => {
    if (!proposalId) return;

    if (!confirm('Are you sure you want to delete this content block?')) {
      return;
    }

    try {
      await proposalService.deleteSectionContent(parseInt(proposalId), sectionId, contentId);
      await loadProposal(parseInt(proposalId));
    } catch (error) {
      console.error('Error deleting content:', error);
      alert('Failed to delete content. Please try again.');
    }
  };

  const handleEditContent = (sectionId: number, contentId: number, content: string, title?: string) => {
    setEditingContent({ sectionId, contentId, content, title: title || '' });
    setEditMode('visual'); // Always start in visual mode
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!proposalId || !editingContent) return;

    try {
      await proposalService.updateSectionContent(
        parseInt(proposalId),
        editingContent.sectionId,
        editingContent.contentId,
        {
          content: editingContent.content,
          title: editingContent.title,
        }
      );

      setShowEditModal(false);
      setEditingContent(null);
      await loadProposal(parseInt(proposalId));
    } catch (error) {
      console.error('Error updating content:', error);
      alert('Failed to update content. Please try again.');
    }
  };

  const openCreateContent = (section: ProposalSection) => {
    setCreatingContentForSection(section);
    setShowSectionContentModal(true);
  };

  const handleSaveNewContent = async (content: string) => {
    if (!proposalId || !creatingContentForSection) return;

    try {
      setAddingContent(true);

      // Add to section - order is based on current content count
      const order = (creatingContentForSection.contents?.length || 0) + 1;

      await proposalService.addContentToSection(
        parseInt(proposalId),
        creatingContentForSection.id,
        {
          content,
          order,
          is_custom: true,
        }
      );

      setShowSectionContentModal(false);
      setCreatingContentForSection(null);
      await loadProposal(parseInt(proposalId));
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Failed to create content. Please try again.');
    } finally {
      setAddingContent(false);
    }
  };

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
      const section = sections.find(s => s.id === currentExportSection);
      const filename = section
        ? `${section.title.replace(/[^a-z0-9]/gi, '_')}.docx`
        : `section_${currentExportSection}.docx`;

      // Create download link
      const blob = new Blob([response], {
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
          <div className="space-y-4">
            {sections.map((section) => {
              const isExpanded = expandedSections.has(section.id);

              return (
                <div
                  key={section.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  {/* Section Header */}
                  <div className="bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-2 px-4 py-3">
                      {/* Drag Handle */}
                      <button className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                      </button>

                      {/* Expand/Collapse Button */}
                      <button
                        onClick={() => toggleSection(section.id)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>

                      {/* Section Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <h2 className="text-lg font-semibold text-gray-900">
                            {section.order}. {section.title}
                          </h2>
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${getSectionStatusColor(
                              section.status
                            )}`}
                          >
                            {section.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                          {section.page_target_min && section.page_target_max && (
                            <span>
                              Target: {section.page_target_min}-{section.page_target_max} pages
                            </span>
                          )}
                          {section.current_pages !== undefined && (
                            <span>Current: {section.current_pages} pages</span>
                          )}
                          {section.contents && (
                            <span>{section.contents.length} content block(s)</span>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleExportSection(section.id, section.title)}
                          disabled={exportingSection === section.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                          title="Export to Word"
                        >
                          {exportingSection === section.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          <span>Export</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Section Content - Only show when expanded */}
                  {isExpanded && (
                    <div className="p-6">
                      {/* Action Bar */}
                      <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-200">
                        <button
                          onClick={() => openContentSearch(section.id)}
                          className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                        >
                          <Library className="w-4 h-4" />
                          <span>Add from Library</span>
                        </button>
                        <button
                          onClick={() => openCreateContent(section)}
                          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Content</span>
                        </button>
                      </div>

                      {/* Content Blocks */}
                      {section.contents && section.contents.length > 0 ? (
                        <div className="space-y-4">
                          {section.contents.map((content, index) => (
                            <div
                              key={content.id}
                              className="border border-gray-200 rounded-lg p-4 hover:border-primary-300 transition-colors"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  {content.title && (
                                    <h3 className="text-base font-medium text-gray-900 mb-1">
                                      {content.title}
                                    </h3>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>Block {index + 1}</span>
                                    {content.word_count && (
                                      <>
                                        <span>•</span>
                                        <span>{content.word_count} words</span>
                                      </>
                                    )}
                                    {content.estimated_pages && (
                                      <>
                                        <span>•</span>
                                        <span>~{content.estimated_pages} pages</span>
                                      </>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleEditContent(section.id, content.id, content.content, content.title)}
                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                    title="Edit content"
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteContent(section.id, content.id)}
                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Remove content"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                              <div
                                className="prose prose-sm max-w-none text-gray-700"
                                dangerouslySetInnerHTML={{ __html: content.content }}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                          <p className="font-medium">No content added yet</p>
                          <p className="text-sm mt-1">Add content from the library or create new content</p>
                        </div>
                      )}

                      {/* Section Notes */}
                      {section.notes && (
                        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs font-medium text-yellow-900 mb-1">Section Notes</p>
                              <p className="text-sm text-yellow-800">{section.notes}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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

        {/* Edit Content Modal */}
        {showEditModal && editingContent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] flex flex-col">
              <div className="p-6 flex-1 overflow-auto">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">
                    Edit Content
                  </h3>
                  {/* Mode Toggle */}
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setEditMode('visual')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        editMode === 'visual'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      Visual
                    </button>
                    <button
                      onClick={() => setEditMode('html')}
                      className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        editMode === 'html'
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      HTML
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (optional)
                  </label>
                  <input
                    type="text"
                    value={editingContent.title || ''}
                    onChange={(e) => setEditingContent({ ...editingContent, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Content block title..."
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {editMode === 'visual' ? 'Content' : 'HTML Content'}
                  </label>

                  {editMode === 'visual' ? (
                    <div className="border border-gray-300 rounded-lg overflow-hidden">
                      <RichTextEditor
                        content={editingContent.content}
                        onChange={(html) => setEditingContent({ ...editingContent, content: html })}
                        editable={true}
                      />
                    </div>
                  ) : (
                    <textarea
                      value={editingContent.content}
                      onChange={(e) => setEditingContent({ ...editingContent, content: e.target.value })}
                      className="w-full h-[400px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                      placeholder="Enter HTML content..."
                    />
                  )}
                </div>

                {editMode === 'html' && (
                  <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                    <div
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: editingContent.content }}
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 bg-gray-50">
                <p className="text-xs text-gray-500">
                  {editMode === 'visual'
                    ? 'Edit content directly. Switch to HTML mode for advanced editing.'
                    : 'Edit raw HTML. Switch to Visual mode for easier editing.'}
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingContent(null);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEdit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Search Modal */}
        <ContentSearchModal
          isOpen={showContentSearch}
          onClose={() => setShowContentSearch(false)}
          onAddContent={handleAddContent}
          sectionId={currentSection || 0}
        />

        {/* Section Content Modal with Google Drive Integration */}
        {creatingContentForSection && (
          <SectionContentModal
            isOpen={showSectionContentModal}
            sectionTitle={creatingContentForSection.title}
            sectionType={creatingContentForSection.section_type}
            onSave={handleSaveNewContent}
            onClose={() => {
              setShowSectionContentModal(false);
              setCreatingContentForSection(null);
            }}
          />
        )}
      </div>
    </div>
  );
};
