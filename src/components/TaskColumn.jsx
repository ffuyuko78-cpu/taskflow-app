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

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatGroupDate(dateStr) {
  if (!dateStr) return 'その他';
  const d = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d - today) / (1000 * 60 * 60 * 24));
  const base = `${d.getMonth() + 1}/${d.getDate()}（${WEEKDAYS[d.getDay()]}）`;
  if (diff === 0) return `${base} 今日`;
  if (diff === 1) return `${base} 明日`;
  if (diff < 0) return `${base} 期限切れ`;
  return base;
}

export function TaskColumn({ category, tasks, onAdd, onToggle, onDelete, onUpdate, onReorder }) {
  const [newText, setNewText] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [activeId, setActiveId] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  // 明日以降：日付の昇順（近い日付が先頭、日付なしは最後）
  const sortedTasks = category === 'future'
    ? [...tasks].sort((a, b) => {
        const da = a.date || a.dueDate || '';
        const db2 = b.date || b.dueDate || '';
        if (!da && !db2) return a.order - b.order;
        if (!da) return 1;
        if (!db2) return -1;
        return da < db2 ? -1 : da > db2 ? 1 : a.order - b.order;
      })
    : [...tasks].sort((a, b) => a.order - b.order);

  // 明日以降：日付ごとにグループ化（日付順を保証）
  const groupedFuture = category === 'future'
    ? sortedTasks.reduce((acc, task) => {
        const key = task.date || task.dueDate || '';
        if (!acc[key]) acc[key] = [];
        acc[key].push(task);
        return acc;
      }, {})
    : null;

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
            {category === 'future' && groupedFuture
              ? Object.entries(groupedFuture)
                  .sort(([a], [b]) => {
                    if (!a && !b) return 0;
                    if (!a) return 1;
                    if (!b) return -1;
                    return a < b ? -1 : a > b ? 1 : 0;
                  })
                  .map(([dateKey, dateTasks]) => (
                  <div key={dateKey} className="date-group">
                    <div className="date-group-header">{formatGroupDate(dateKey)}</div>
                    {dateTasks.map(task => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onToggle={onToggle}
                        onDelete={onDelete}
                        onUpdate={onUpdate}
                      />
                    ))}
                  </div>
                ))
              : sortedTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onToggle={onToggle}
                    onDelete={onDelete}
                    onUpdate={onUpdate}
                  />
                ))
            }
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
