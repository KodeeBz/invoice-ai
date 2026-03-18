"use client";

import { Plus, Trash2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export interface SectionData {
  id: string;
  title: string;
  content: string;
}

interface SectionEditorProps {
  sections: SectionData[];
  onChange: (sections: SectionData[]) => void;
}

function SortableSection({
  section,
  index,
  onUpdate,
  onDelete,
}: {
  section: SectionData;
  index: number;
  onUpdate: (index: number, field: "title" | "content", value: string) => void;
  onDelete: (index: number) => void;
}) {
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
      className="group rounded-lg border border-gray-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800"
    >
      <div className="mb-3 flex items-center gap-2">
        <button
          type="button"
          className="cursor-grab rounded p-1 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <input
          type="text"
          value={section.title}
          onChange={(e) => onUpdate(index, "title", e.target.value)}
          placeholder="Section Title"
          className="flex-1 rounded border border-gray-200 bg-transparent px-3 py-1.5 text-sm font-semibold text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-slate-600 dark:text-gray-100"
        />
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-danger dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <textarea
        value={section.content}
        onChange={(e) => onUpdate(index, "content", e.target.value)}
        placeholder="Section content... Use bullet points with - for lists."
        rows={5}
        className="block w-full rounded-lg border border-gray-200 bg-transparent px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-slate-600 dark:text-gray-100 dark:placeholder-gray-500"
      />
    </div>
  );
}

export function SectionEditor({ sections, onChange }: SectionEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addSection = () => {
    onChange([
      ...sections,
      {
        id: `section-${Date.now()}`,
        title: "",
        content: "",
      },
    ]);
  };

  const updateSection = (
    index: number,
    field: "title" | "content",
    value: string
  ) => {
    const updated = [...sections];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const deleteSection = (index: number) => {
    onChange(sections.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    onChange(arrayMove(sections, oldIndex, newIndex));
  };

  return (
    <div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sections.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {sections.map((section, index) => (
              <SortableSection
                key={section.id}
                section={section}
                index={index}
                onUpdate={updateSection}
                onDelete={deleteSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={addSection}
        className="mt-3"
      >
        <Plus className="h-4 w-4" />
        Add Section
      </Button>
    </div>
  );
}
