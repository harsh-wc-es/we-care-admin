export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  return (
    <div className={`admin-toast admin-toast--${toast.type || 'success'}`}>
      <span className="admin-toast__icon">
        {toast.type === 'error' ? '✕' : toast.type === 'warning' ? '⚠' : '✓'}
      </span>
      <span className="admin-toast__message">{toast.message}</span>
      <button className="admin-toast__close" type="button" onClick={onClose}>×</button>
    </div>
  );
}
