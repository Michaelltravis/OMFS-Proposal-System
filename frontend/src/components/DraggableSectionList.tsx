import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Edit, Trash2, FileText, Plus } from 'lucide-react';
import type { ProposalSection } from '../types';

interface DraggableSectionListProps {
  sections: ProposalSection[];
  onReorder: (sections: ProposalSection[]) => void;
  onEdit: (section: ProposalSection) => void;
  onDelete: (sectionId: number) => void;
  onAddContent: (sectionId: number) => void;
}

interface SortableItemProps {
  section: ProposalSection;
  index: number;
  onEdit: (section: ProposalSection) => void;
  onDelete: (sectionId: number) => void;
  onAddContent: (sectionId: number) => void;
}

const SortableItem: React.FC<SortableItemProps> = ({
  section,
  index,
  onEdit,
  onDelete,
  onAddContent,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white border-2 rounded-lg p-4 mb-3 ${
        isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          className="mt-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 focus:outline-none"
          {...attributes}
          {...listeners}
        >
          <GripVertical size={24} />
        </button>

        {/* Section Number Badge */}
        <div className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold text-lg">
          {index + 1}
        </div>

        {/* Section Content */}
        <div className="flex-grow min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-grow">
              <h3 className="text-lg font-semibold text-gray-900">{section.title}</h3>
              {section.notes && (
                <p className="text-sm text-gray-600 mt-1">{section.notes}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                {((section.page_target_min && section.page_target_min > 0) || (section.page_target_max && section.page_target_max > 0)) && (
                  <span className="flex items-center gap-1">
                    <FileText size={14} />
                    Target: {section.page_target_min || 0}-{section.page_target_max || 0} pages
                  </span>
                )}
                {section.status && (
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    section.status === 'completed' ? 'bg-green-100 text-green-800' :
                    section.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {section.status.replace('_', ' ')}
                  </span>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => onAddContent(section.id)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                title="Add Content"
              >
                <Plus size={18} />
              </button>
              <button
                onClick={() => onEdit(section)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded transition-colors"
                title="Edit Section"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={() => onDelete(section.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                title="Delete Section"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const DraggableSectionList: React.FC<DraggableSectionListProps> = ({
  sections,
  onReorder,
  onEdit,
  onDelete,
  onAddContent,
}) => {
  const [items, setItems] = useState(sections);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require dragging 8px before activating
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  React.useEffect(() => {
    setItems(sections);
  }, [sections]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.id === active.id);
      const newIndex = items.findIndex((item) => item.id === over.id);

      const newItems = arrayMove(items, oldIndex, newIndex);

      // Update the order field for all sections
      const reorderedSections = newItems.map((item, index) => ({
        ...item,
        order: index,
      }));

      setItems(reorderedSections);
      onReorder(reorderedSections);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <FileText size={48} className="mx-auto text-gray-400 mb-3" />
        <p className="text-gray-600 font-medium">No sections yet</p>
        <p className="text-sm text-gray-500 mt-1">Add sections to start building your proposal</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Drag sections by the grip handle to reorder them. Section numbers will update automatically.
        </p>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map(item => item.id)}
          strategy={verticalListSortingStrategy}
        >
          {items.map((section, index) => (
            <SortableItem
              key={section.id}
              section={section}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddContent={onAddContent}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
};
