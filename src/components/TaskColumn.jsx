import { useState } from 'react';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors, DragOverlay
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy, arrayMove
} from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';

const LABELS = {
  daily: '毎日',
  today: '今日',
  future: '明日以降',
};

const ICONS = {
  daily: '🔁',
  today: '⚡',
  future: '📅',
};

export function TaskColumn({ category, tasks, onAdd, onToggle, onDelete, onUpdate, onReorder }) {
  const [newText, setNewText] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const sortedTasks = [...tasks].sort((a, b) => a.order - b.order);
  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null;

  const handleDragStart = ({ active }) => setActiveId(active.id);

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null);
    if (!over || active.id === over.id) return;
    const oldIndex = sortedTasks.findIndex(t => t.id === active.id);
    const newIndex = sortedTasks.findIndex(t => t.id === over.id);
    const reordered = arrayMove(sortedTasks, oldIndex, newIndex);
    onReorder(category, reordered.map(t => t.id));
  };

  const handleAdd = () => {
    if (!newText.trim()) return;
    const date = category === 'future' ? newDate : null;
    onAdd(category, newText, date, newDueDate || null);
    setNewText('');
    setNewDate('');
    setNewDueDate('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  return (
    <div className={`task-column column-${category}`}>
      <div className="column-header">
        <span className="column-icon">{ICONS[category]}</span>
        <span className="column-label">{LABELS[category]}</span>
        <span className="column-count">{tasks.filter(t => !t.completed).length}</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortedTasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          <div className="task-list">
            {sortedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </SortableContext>
        <DragOverlay>
          {activeTask ? (
            <div className="task-card drag-overlay">
              <span className="task-text">{activeTask.text}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <div className="add-task-area">
        <div className="add-task-row">
          <input
            className="add-task-input"
            placeholder={`+ ${LABELS[category]}タスクを追加`}
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {category === 'future' && (
            <input
              type="date"
              className="add-date-input"
              value={newDate}
              onChange={e => setNewDate(e.target.value)}
              title="スケジュール日"
            />
          )}
          <button className="add-btn" onClick={handleAdd}>追加</button>
        </div>
        <div className="add-due-row">
          <label className="add-due-label">⏰ 期限日</label>
          <input
            type="date"
            className="add-date-input add-due-input"
            value={newDueDate}
            onChange={e => setNewDueDate(e.target.value)}
            title="期限日（1日前に通知）"
          />
        </div>
      </div>
    </div>
  );
}
