export default function ErrorState({ title = 'Something went wrong', message = '', onRetry }) {
  return (
    <div className="admin-error-state">
      <h3>{title}</h3>
      {message && <p style={{margin:'4px 0 10px',fontSize:13,color:'#6B7280'}}>{message}</p>}
      {onRetry && <button className="btn btn-primary" type="button" onClick={onRetry}>Retry</button>}
    </div>
  );
}
