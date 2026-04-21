import { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { formatDisplayDate, getDateColor } from '../utils/dateUtils';
import { DateEditorModal } from './DateEditorModal';

export function Header({ user, appDate, onStartClick, onEndClick, onDateChange, onCalendarClick, onCalendarReset }) {
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);
  const [showDateEditor, setShowDateEditor] = useState(false);
  const menuRef = useRef(null);

  const { month, day, dow } = formatDisplayDate(appDate);
  const dateColor = getDateColor(appDate);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowAvatarMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = async () => {
    setShowAvatarMenu(false);
    await signOut(auth);
  };

  return (
    <>
      <header className="app-header">
        <div className="header-left">
          <div
            className={`header-date date-${dateColor}`}
            onClick={() => setShowDateEditor(true)}
            title="タップして日付を変更"
          >
            <span className="date-month-day">{month}/{day}</span>
            <span className="date-dow">（{dow}）</span>
          </div>
        </div>

        <div className="header-center">
          <span className="app-title">タスク管理アプリ</span>
        </div>

        <div className="header-right">
          <button className="ritual-btn calendar-btn" onClick={onCalendarClick} title="Googleカレンダーから取り込む">
            📅
          </button>
          <button className="ritual-btn start-btn" onClick={onStartClick}>
            始める
          </button>
          <button className="ritual-btn end-btn" onClick={onEndClick}>
            終わり
          </button>

          <div className="avatar-wrapper" ref={menuRef}>
            <button
              className="avatar-btn"
              onClick={() => setShowAvatarMenu(prev => !prev)}
              aria-label="user menu"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.displayName?.[0] || user?.email?.[0] || '?'}
                </div>
              )}
            </button>

            {showAvatarMenu && (
              <div className="avatar-menu">
                <div className="avatar-menu-user">
                  <span className="avatar-menu-name">{user?.displayName || user?.email}</span>
                </div>
                {onCalendarReset && (
                  <button className="avatar-menu-item" onClick={() => { setShowAvatarMenu(false); onCalendarReset(); }}>
                    🔄 カレンダーを再同期
                  </button>
                )}
                <button className="avatar-menu-item logout-item" onClick={handleLogout}>
                  🚪 ログアウト
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {showDateEditor && (
        <DateEditorModal
          currentDate={appDate}
          onClose={() => setShowDateEditor(false)}
          onSave={onDateChange}
        />
      )}
    </>
  );
}
