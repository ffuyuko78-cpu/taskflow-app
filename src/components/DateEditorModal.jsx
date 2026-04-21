import { useState } from 'react';
import { addDays, toDateStr } from '../utils/dateUtils';

export function DateEditorModal({ currentDate, onClose, onSave }) {
  const [value, setValue] = useState(currentDate);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal-small" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 日付を変更</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          <input
            type="date"
            className="date-edit-input"
            value={value}
            onChange={e => setValue(e.target.value)}
          />
          <div className="quick-date-row">
            <button className="quick-date-btn" onClick={() => setValue(toDateStr(new Date()))}>
              今日
            </button>
            <button className="quick-date-btn" onClick={() => setValue(addDays(toDateStr(new Date()), 1))}>
              明日
            </button>
            <button className="quick-date-btn" onClick={() => setValue(addDays(value, -1))}>
              ー1日
            </button>
            <button className="quick-date-btn" onClick={() => setValue(addDays(value, 1))}>
              ＋1日
            </button>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>キャンセル</button>
          <button className="btn-primary" onClick={() => { onSave(value); onClose(); }}>
            保存
          </button>
        </div>
      </div>
    </div>
  );
}
