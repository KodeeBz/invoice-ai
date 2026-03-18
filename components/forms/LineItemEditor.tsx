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

export interface LineItemData {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  aiGenerated?: boolean;
}

interface LineItemEditorProps {
  items: LineItemData[];
  onChange: (items: LineItemData[]) => void;
}

function SortableRow({
  item,
  index,
  onUpdate,
  onDelete,
}: {
  item: LineItemData;
  index: number;
  onUpdate: (index: number, field: keyof LineItemData, value: string | number) => void;
  onDelete: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className="group">
      <td className="px-2 py-2">
        <button
          type="button"
          className="cursor-grab rounded p-1 text-gray-300 hover:text-gray-500 dark:text-gray-600 dark:hover:text-gray-400"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </td>
      <td className="px-2 py-2">
        <input
          type="text"
          value={item.description}
          onChange={(e) => onUpdate(index, "description", e.target.value)}
          placeholder="Description"
          className="w-full rounded border border-gray-200 bg-transparent px-2 py-1.5 text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-slate-600 dark:text-gray-100"
        />
        {item.aiGenerated && (
          <span className="mt-0.5 inline-block text-[10px] text-amber-500">
            AI Generated
          </span>
        )}
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) =>
            onUpdate(index, "quantity", parseFloat(e.target.value) || 0)
          }
          min="0"
          step="0.5"
          className="w-20 rounded border border-gray-200 bg-transparent px-2 py-1.5 text-right text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-slate-600 dark:text-gray-100"
        />
      </td>
      <td className="px-2 py-2">
        <input
          type="number"
          value={item.unitPrice}
          onChange={(e) =>
            onUpdate(index, "unitPrice", parseFloat(e.target.value) || 0)
          }
          min="0"
          step="0.01"
          className="w-28 rounded border border-gray-200 bg-transparent px-2 py-1.5 text-right text-sm text-gray-900 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 dark:border-slate-600 dark:text-gray-100"
        />
      </td>
      <td className="px-2 py-2 text-right font-mono text-sm text-gray-900 dark:text-gray-100">
        ${item.total.toFixed(2)}
      </td>
      <td className="px-2 py-2">
        <button
          type="button"
          onClick={() => onDelete(index)}
          className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-danger dark:text-gray-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </tr>
  );
}

export function LineItemEditor({ items, onChange }: LineItemEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const addItem = () => {
    onChange([
      ...items,
      {
        id: `item-${Date.now()}`,
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]);
  };

  const updateItem = (
    index: number,
    field: keyof LineItemData,
    value: string | number
  ) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Recalculate total for this row
    if (field === "quantity" || field === "unitPrice") {
      updated[index].total =
        updated[index].quantity * updated[index].unitPrice;
    }

    onChange(updated);
  };

  const deleteItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    onChange(arrayMove(items, oldIndex, newIndex));
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-slate-700">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-gray-200 bg-gray-50 dark:border-slate-700 dark:bg-slate-800/50">
            <tr>
              <th className="w-8 px-2 py-2" />
              <th className="px-2 py-2 font-medium text-gray-500 dark:text-gray-400">
                Description
              </th>
              <th className="w-24 px-2 py-2 font-medium text-gray-500 dark:text-gray-400">
                Qty
              </th>
              <th className="w-32 px-2 py-2 font-medium text-gray-500 dark:text-gray-400">
                Unit Price
              </th>
              <th className="w-28 px-2 py-2 text-right font-medium text-gray-500 dark:text-gray-400">
                Total
              </th>
              <th className="w-10 px-2 py-2" />
            </tr>
          </thead>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={items.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <tbody className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {items.map((item, index) => (
                  <SortableRow
                    key={item.id}
                    item={item}
                    index={index}
                    onUpdate={updateItem}
                    onDelete={deleteItem}
                  />
                ))}
              </tbody>
            </SortableContext>
          </DndContext>
        </table>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={addItem}
        className="mt-2"
      >
        <Plus className="h-4 w-4" />
        Add Line Item
      </Button>
    </div>
  );
}
