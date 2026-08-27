export default function EmptyState({ title, message }) {
  return (
    <div className="admin-empty-state">
      <h3>{title}</h3>
      {message && <p>{message}</p>}
    </div>
  );
}
