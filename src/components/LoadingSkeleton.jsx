export default function LoadingSkeleton({ style = {} }) {
  return (
    <div className="table-skeleton" style={{ borderRadius: 4, ...style }} />
  );
}
