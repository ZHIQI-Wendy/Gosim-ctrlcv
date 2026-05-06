// components/LegendPanel.tsx
const legendRows = [
  ["Blue dashed arrow", "French advance / counterattack"],
  ["Red dashed arrow", "German advance"],
  ["Hatched zone", "High-risk combat gap"],
  ["Blue square", "French unit"],
  ["Red square", "German unit"],
  ["Ringed black point", "Strategic city"],
  ["Dashed dark line", "Railway"],
  ["Green river line", "River / canal"]
];

export function LegendPanel() {
  return (
    <section className="legend-float">
      <h3>Legend</h3>
      <ul>
        {legendRows.map(([label, detail]) => (
          <li key={label}>
            <strong>{label}</strong>
            <span>{detail}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
