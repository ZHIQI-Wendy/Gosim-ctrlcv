export function MechanicHint({
  discovered,
  onOpen
}: {
  discovered: boolean;
  onOpen: () => void;
}) {
  if (!discovered) return null;

  return (
    <section className="mechanic-float">
      <h3>Discovered: Hidden Mechanic Entry</h3>
      <p>
        City popups now expose historical mechanics such as city vehicle requisition. This branch can boost mobility
        and local supply.
      </p>
      <button onClick={onOpen}>View Mechanic Tree</button>
    </section>
  );
}
