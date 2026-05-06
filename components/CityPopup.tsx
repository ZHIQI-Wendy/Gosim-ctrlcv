// components/CityPopup.tsx
import { GameStateData, MapNodeId } from "@/types";

export const cityTitles: Record<MapNodeId, string> = {
  paris: "Paris",
  paris_rail_hub: "Paris Rail Hub",
  ourcq_line: "Ourcq Line",
  meaux: "Meaux",
  marne_crossings: "Marne Crossings",
  coulommiers: "Coulommiers",
  montmirail: "Montmirail",
  senlis: "Senlis",
  aisne_road: "Aisne Road",
  soissons: "Soissons",
  chateau_thierry: "Chateau-Thierry",
  reims: "Reims",
  epernay: "Epernay",
  chalons: "Chalons-sur-Marne",
  verdun: "Verdun",
  bar_le_duc: "Bar-le-Duc",
  sezanne: "Sezanne",
  fere_champenoise: "Fere-Champenoise"
};

function localThreat(game: GameStateData, city: MapNodeId): number {
  const nodeUnits = game.units.filter((unit) => unit.nodeId === city);
  const german = nodeUnits
    .filter((unit) => unit.side === "german")
    .reduce((sum, unit) => sum + unit.strength, 0);
  const allied = nodeUnits
    .filter((unit) => unit.side === "allied")
    .reduce((sum, unit) => sum + unit.strength, 0);

  const balance = german + allied > 0 ? (german / (german + allied)) * 100 : game.parisThreat;
  return Math.round((balance * 0.6 + game.parisThreat * 0.4));
}

export function CityPopup({ city, game }: { city: MapNodeId | null; game: GameStateData }) {
  if (!city) return null;

  const node = game.nodes.find((item) => item.id === city);
  if (!node) return null;

  const units = game.units.filter((unit) => unit.nodeId === city);
  const adjacent = game.edges
    .filter((edge) => edge.from === city || edge.to === city)
    .map((edge) => (edge.from === city ? edge.to : edge.from));

  const threat = localThreat(game, city);
  const latestReport = game.reports[0]?.reportText ?? "No recent report.";

  return (
    <section className="city-popup">
      <p style={{ margin: "auto" }}>
        Local status: <strong>{threat > 75 ? "High Threat" : threat > 50 ? "Elevated" : "Guarded"}</strong>
      </p>

      <div className="popup-meter">
        <span>Local Threat</span>
        <div className="meter-shell">
          <div className="meter-fill" style={{ width: `${threat}%`, background: "#b1493f" }} />
        </div>
      </div>

      <p>
        Control: <strong>{node.control}</strong>
      </p>
      <p>Terrain: {node.type}</p>
      <p>Defense value: {node.defenseValue}</p>
      <p>Transport value: {node.transportValue}</p>
      <p>Supply value: {node.supplyValue}</p>

      <p>
        Current units: {units.length === 0 ? "None" : units.map((unit) => `${unit.name} (${Math.round(unit.strength)})`).join(", ")}
      </p>

      <p>Adjacent routes: {adjacent.length ? adjacent.join(", ") : "No adjacent routes"}</p>
      <p>Common info: {node.commonInfo ?? "N/A"}</p>
      <p>Special info: {node.specialInfo ?? "N/A"}</p>
      <p className="warning">Latest report: {latestReport}</p>

      {city === "paris" && game.cityVehiclesDiscovered && !game.cityVehiclesUsed && (
        <p className="warning">City vehicles discovered. Use a text command to requisition transport.</p>
      )}
    </section>
  );
}
