export default function ConfirmationModal({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  warning,
  loading = false,
  confirmDisabled = false,
  onConfirm,
  onCancel,
  children,
}) {
  return (
    <div className="drawer-overlay confirm-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel?.(); }}>
      <div className="confirm-modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-modal-title" style={{ color: '#1b4d1c', marginBottom: 8 }}>{title}</h2>
        <p style={{ fontSize: 14, color: '#374151', margin: '0 0 12px' }}>{message}</p>
        {warning && <div className="confirm-modal__warning">{warning}</div>}
        {children}
        <div className="confirm-modal__actions">
          <button className="btn btn-outline" type="button" disabled={loading} onClick={onCancel}>{cancelLabel}</button>
          <button className="btn btn-primary" type="button" disabled={loading || confirmDisabled} onClick={onConfirm}>
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
