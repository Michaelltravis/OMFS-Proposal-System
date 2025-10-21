/**
 * TipTap Rich Text Editor Component
 * Supports: headings, bold, italic, bullets, tables, track changes
 */
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Table as TableIcon,
  Undo,
  Redo,
  Type,
  RemoveFormatting,
} from 'lucide-react';
import { useEffect } from 'react';
import { InsertionMark, DeletionMark } from '../../extensions/TrackChangesExtensions';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
  trackChangesEnabled?: boolean;
  currentUser?: { name: string; id: string };
  onTrackChange?: (changeId: string, changeType: 'insert' | 'delete', user: string, userId: string, timestamp: string) => void;
}

const MenuBar = ({ editor }: { editor: Editor | null }) => {
  if (!editor) return null;

  const buttonClass = (isActive: boolean) =>
    `p-2 rounded hover:bg-gray-100 ${isActive ? 'bg-gray-200' : ''}`;

  return (
    <div className="border-b border-gray-300 p-2 flex flex-wrap gap-1 bg-gray-50">
      {/* Text Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        title="Bold"
      >
        <Bold className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        title="Italic"
      >
        <Italic className="w-4 h-4" />
      </button>

      {/* Separator */}
      <div className="w-px bg-gray-300 mx-1"></div>

      {/* Paragraph Style */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={buttonClass(editor.isActive('paragraph'))}
        title="Body Text"
      >
        <Type className="w-4 h-4" />
      </button>

      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 1 }))}
        title="Heading 1 (14pt)"
      >
        <Heading1 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        title="Heading 2 (12pt)"
      >
        <Heading2 className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 3 }))}
        title="Heading 3 (11pt)"
      >
        <Heading3 className="w-4 h-4" />
      </button>

      {/* Separator */}
      <div className="w-px bg-gray-300 mx-1"></div>

      {/* Lists */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      {/* Separator */}
      <div className="w-px bg-gray-300 mx-1"></div>

      {/* Table */}
      <button
        type="button"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        className={buttonClass(editor.isActive('table'))}
        title="Insert Table"
      >
        <TableIcon className="w-4 h-4" />
      </button>

      {/* Separator */}
      <div className="w-px bg-gray-300 mx-1"></div>

      {/* Clear Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
        className={buttonClass(false)}
        title="Clear Formatting"
      >
        <RemoveFormatting className="w-4 h-4" />
      </button>

      {/* Separator */}
      <div className="w-px bg-gray-300 mx-1"></div>

      {/* Undo/Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className={`${buttonClass(false)} disabled:opacity-30`}
        title="Undo"
      >
        <Undo className="w-4 h-4" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className={`${buttonClass(false)} disabled:opacity-30`}
        title="Redo"
      >
        <Redo className="w-4 h-4" />
      </button>
    </div>
  );
};

export const RichTextEditor = ({
  content,
  onChange,
  placeholder = 'Start typing...',
  editable = true,
  trackChangesEnabled = false,
  currentUser = { name: 'Unknown User', id: 'unknown' },
  onTrackChange,
}: RichTextEditorProps) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      InsertionMark,
      DeletionMark,
    ],
    content,
    editable,
    onUpdate: ({ editor, transaction }) => {
      // Handle track changes if enabled
      if (trackChangesEnabled && transaction.docChanged) {
        const { from, to } = transaction.selection;
        const text = transaction.doc.textBetween(from, to);

        // Check if this is an insertion or deletion
        transaction.steps.forEach((step: any) => {
          if (step.slice && step.slice.content.size > 0) {
            // Insertion
            const changeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = new Date().toISOString();

            // Mark the inserted text
            editor.chain()
              .setTextSelection({ from: step.from, to: step.from + step.slice.content.size })
              .setMark('insertion', {
                'data-change-id': changeId,
                'data-change-type': 'insert',
                'data-user': currentUser.name,
                'data-user-id': currentUser.id,
                'data-timestamp': timestamp,
              })
              .run();

            if (onTrackChange) {
              onTrackChange(changeId, 'insert', currentUser.name, currentUser.id, timestamp);
            }
          } else if (step.from !== undefined && step.to !== undefined && step.from < step.to) {
            // Deletion - mark the text as deleted instead of removing it
            const changeId = `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            const timestamp = new Date().toISOString();

            editor.chain()
              .setTextSelection({ from: step.from, to: step.to })
              .setMark('deletion', {
                'data-change-id': changeId,
                'data-change-type': 'delete',
                'data-user': currentUser.name,
                'data-user-id': currentUser.id,
                'data-timestamp': timestamp,
              })
              .run();

            if (onTrackChange) {
              onTrackChange(changeId, 'delete', currentUser.name, currentUser.id, timestamp);
            }
          }
        });
      }

      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4',
      },
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      {editable && <MenuBar editor={editor} />}
      <div className="tiptap-content max-h-[500px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .tiptap-content .ProseMirror {
          min-height: 300px;
          padding: 1rem;
          outline: none;
          font-size: 11pt;
        }
        .tiptap-content .ProseMirror h1 {
          font-size: 14pt;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .tiptap-content .ProseMirror h2 {
          font-size: 12pt;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .tiptap-content .ProseMirror h3 {
          font-size: 11pt;
          font-weight: bold;
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        .tiptap-content .ProseMirror ul,
        .tiptap-content .ProseMirror ol {
          padding-left: 2em;
          margin: 0.5em 0;
        }
        .tiptap-content .ProseMirror ul {
          list-style-type: disc;
        }
        .tiptap-content .ProseMirror ol {
          list-style-type: decimal;
        }
        .tiptap-content .ProseMirror table {
          border-collapse: collapse;
          margin: 1em 0;
          width: 100%;
        }
        .tiptap-content .ProseMirror table td,
        .tiptap-content .ProseMirror table th {
          border: 1px solid #ddd;
          padding: 0.5em;
          min-width: 50px;
        }
        .tiptap-content .ProseMirror table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        .tiptap-content .ProseMirror p {
          margin: 0.5em 0;
          font-size: 11pt;
        }
        .tiptap-content .ProseMirror strong {
          font-weight: bold;
        }
        .tiptap-content .ProseMirror em {
          font-style: italic;
        }

        /* Track Changes Styles */
        .tiptap-content .ProseMirror .track-change-insert {
          background-color: #d4edda;
          border-bottom: 2px solid #28a745;
          color: #155724;
          padding: 0 2px;
        }
        .tiptap-content .ProseMirror .track-change-delete {
          background-color: #f8d7da;
          text-decoration: line-through;
          color: #721c24;
          padding: 0 2px;
        }
      `}</style>
    </div>
  );
};
