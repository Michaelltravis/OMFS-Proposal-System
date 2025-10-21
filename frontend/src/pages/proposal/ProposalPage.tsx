/**
 * Proposal Builder Page - Create and manage proposals
 */
import { useState, useEffect } from 'react';
import { useParams } from 'react-router';
import { Download, FileText, Loader2, MessageSquare } from 'lucide-react';
import { proposalService } from '../../services/proposalService';
import type { Proposal, ProposalSection } from '../../types';

export const ProposalPage = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [sections, setSections] = useState<ProposalSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportingSection, setExportingSection] = useState<number | null>(null);
  const [showFormatModal, setShowFormatModal] = useState(false);
  const [currentExportSection, setCurrentExportSection] = useState<number | null>(null);
  const [formattingInstructions, setFormattingInstructions] = useState('');

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
                    <div className="space-y-4">
                      {section.contents.map((content) => (
                        <div key={content.id} className="border-l-4 border-blue-200 pl-4">
                          {content.title && (
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                              {content.title}
                            </h3>
                          )}
                          <div
                            className="prose prose-sm max-w-none text-gray-700"
                            dangerouslySetInnerHTML={{ __html: content.content }}
                          />
                          {content.word_count && (
                            <p className="text-xs text-gray-500 mt-2">
                              {content.word_count} words
                              {content.estimated_pages && ` • ~${content.estimated_pages} pages`}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <p>No content added to this section yet.</p>
                    </div>
                  )}
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
