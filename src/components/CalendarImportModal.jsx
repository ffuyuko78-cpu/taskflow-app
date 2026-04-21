import { useState, useEffect } from 'react';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';

// 日付文字列を「4/21（月）」形式で返す
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dow = ['日', '月', '火', '水', '木', '金', '土'][d.getDay()];
  return `${month}/${day}（${dow}）`;
}

// 時刻文字列を「HH:MM」形式で返す（終日イベントは空文字）
function formatTime(event) {
  const dt = event.start?.dateTime;
  if (!dt) return '';
  const d = new Date(dt);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function CalendarImportModal({ onClose, onImport }) {
  const { events, loading, error, fetchEvents, getEventDate, isToday } = useGoogleCalendar();
  const [selected, setSelected] = useState(new Set());

  // モーダルが開いたら自動でカレンダー取得開始
  useEffect(() => {
    fetchEvents();
  }, []); // eslint-disable-line

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === events.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(events.map(e => e.id)));
    }
  };

  const handleImport = () => {
    const targets = events.filter(e => selected.has(e.id));
    const tasks = targets.map(event => {
      const dateStr = getEventDate(event);
      const category = isToday(dateStr) ? 'today' : 'future';
      const time = formatTime(event);
      const text = time ? `${time} ${event.summary}` : event.summary;
      return { text, category, dueDate: dateStr };
    });
    onImport(tasks);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>📅 カレンダーから取り込む</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {/* 読み込み中 */}
          {loading && (
            <div className="calendar-loading">
              <div className="loading-spinner" style={{ width: 28, height: 28 }} />
              <p>カレンダーを読み込んでいます…</p>
            </div>
          )}

          {/* エラー */}
          {!loading && error && (
            <div className="calendar-error">
              <p>⚠️ {error}</p>
              <button className="btn-secondary" style={{ marginTop: 10 }} onClick={fetchEvents}>
                もう一度試す
              </button>
            </div>
          )}

          {/* 予定なし */}
          {!loading && !error && events.length === 0 && (
            <p className="modal-empty">今後30日間の予定はありません</p>
          )}

          {/* イベント一覧 */}
          {!loading && !error && events.length > 0 && (
            <>
              <div className="calendar-list-header">
                <label className="calendar-select-all">
                  <input
                    type="checkbox"
                    checked={selected.size === events.length}
                    onChange={toggleAll}
                  />
                  すべて選択
                </label>
                <span className="modal-label" style={{ margin: 0 }}>
                  {selected.size}/{events.length}件 選択中
                </span>
              </div>

              <ul className="calendar-event-list">
                {events.map(event => {
                  const dateStr = getEventDate(event);
                  const time = formatTime(event);
                  const today = isToday(dateStr);
                  return (
                    <li
                      key={event.id}
                      className={`task-check-item ${selected.has(event.id) ? 'calendar-item-selected' : ''}`}
                      onClick={() => toggleSelect(event.id)}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(event.id)}
                        onChange={() => toggleSelect(event.id)}
                        onClick={e => e.stopPropagation()}
                      />
                      <div className="calendar-event-info">
                        <span className="calendar-event-title">{event.summary}</span>
                        <span className="calendar-event-date">
                          {formatDate(dateStr)}{time ? ` ${time}` : ' 終日'}
                        </span>
                      </div>
                      <span className={`calendar-event-badge ${today ? 'badge-today' : 'badge-future'}`}>
                        {today ? '今日' : 'これから'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {!loading && !error && events.length > 0 && (
          <div className="modal-footer">
            <button className="btn-secondary" onClick={onClose}>
              キャンセル
            </button>
            <button
              className="btn-primary"
              onClick={handleImport}
              disabled={selected.size === 0}
            >
              {selected.size}件をタスクに追加
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
