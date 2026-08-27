export default function FilterBar({ filters, active, onChange }) {
  const labelFor = (value) => String(value)
    .replace(/caregivers/gi, 'caretakers')
    .replace(/caregiver/gi, 'caretaker')
    .replace(/_/g, ' ');

  return (
    <div className="filter-tabs responsive-filter-tabs">
      {filters.map((f) => (
        <button
          key={f}
          className={`filter-tab${active === f ? ' active' : ''}`}
          onClick={() => onChange(f)}
          style={{padding:'5px 14px',fontSize:12,whiteSpace:'nowrap'}}
        >
          {labelFor(f)}
        </button>
      ))}
    </div>
  );
}
