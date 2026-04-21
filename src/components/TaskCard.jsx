import { useState, useRef, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getMonth() + 1}月${d.getDate()}日（${WEEKDAYS[d.getDay()]}）`;
}

export function TaskCard({ task, onToggle, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(task.text);
  const [editDate, setEditDate] = useState(task.category === 'future' ? (task.date || '') : '');
  const [editDueDate, setEditDueDate] = useState(task.dueDate || '');
  const inputRef = useRef(null);

  const {
    attributes, listeners, setNodeRef,
    transform, transition, isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const handleSave = () => {
    if (editText.trim()) {
      const updates = { text: editText.trim(), dueDate: editDueDate || null };
      if (task.category === 'future') updates.date = editDate || null;
      onUpdate(task.id, updates);
    }
    setEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditText(task.text); setEditing(false); }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`task-card ${task.completed ? 'completed' : ''} ${isDragging ? 'dragging' : ''}`}
    >
      <div
        className="drag-handle"
        {...attributes}
        {...listeners}
        aria-label="drag handle"
      >
        ⋮⋮
      </div>

      <button
        className={`check-btn ${task.completed ? 'checked' : ''}`}
        onClick={() => onToggle(task.id, task.completed)}
        aria-label="complete"
      >
        {task.completed ? '✓' : ''}
      </button>

      <div className="task-content" onDoubleClick={() => setEditing(true)}>
        {editing ? (
          <div className="task-edit-area">
            <input
              ref={inputRef}
              className="task-edit-input"
              value={editText}
              onChange={e => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSave}
            />
            {task.category === 'future' && (
              <input
                type="date"
                className="task-date-input"
                value={editDate}
                onChange={e => setEditDate(e.target.value)}
              />
            )}
            <div className="task-due-edit-row">
              <label className="task-due-label">期限日</label>
              <input
                type="date"
                className="task-date-input"
                value={editDueDate}
                onChange={e => setEditDueDate(e.target.value)}
              />
            </div>
          </div>
        ) : (
          <div className="task-text-area">
            <span className="task-text">{task.text}</span>
            {task.category === 'future' && task.date && !task.dueDate && (
              <span className="task-date-badge">{formatDate(task.date)}</span>
            )}
            {task.dueDate && (
              <>
                <span className="task-due-badge">⏰ {formatDate(task.dueDate)}</span>
                <span className="task-reminder-badge">🔔 1日前</span>
              </>
            )}
          </div>
        )}
      </div>

      <button
        className="delete-btn"
        onClick={() => onDelete(task.id)}
        aria-label="delete"
      >
        ×
      </button>
    </div>
  );
}
