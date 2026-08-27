export default function DrawerPanel({ title, onClose, children }) {
  return (
    <div className="drawer-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="user-drawer">
        <div className="user-drawer__header">
          <div>
            <h2>{title}</h2>
          </div>
          <button className="btn btn-outline" onClick={onClose} style={{ padding: '4px 10px', fontSize: 16, lineHeight: 1 }}>X</button>
        </div>
        {children}
      </div>
    </div>
  );
}
