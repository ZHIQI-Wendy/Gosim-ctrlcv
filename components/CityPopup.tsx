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

function toneColor(value: number, palette: "threat" | "utility"): string {
  if (palette === "threat") {
    if (value > 75) return "#b1493f";
    if (value > 50) return "#c28d43";
    return "#6e8f54";
  }

  if (value > 75) return "#c9b06f";
  if (value > 50) return "#9f9569";
  return "#6f7c68";
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
  const unitSummary =
    units.length === 0 ? "None" : units.map((unit) => `${unit.name} (${Math.round(unit.strength)})`).join(", ");

  return (
    <section className="city-popup">
      <div className="city-popup-status">
        <span>Local status</span>
        <strong>{threat > 75 ? "High Threat" : threat > 50 ? "Elevated" : "Guarded"}</strong>
      </div>

      <div className="popup-meter">
        <span>Local Threat</span>
        <div className="meter-shell">
          <div className="meter-fill" style={{ width: `${threat}%`, background: toneColor(threat, "threat") }} />
        </div>
      </div>

      <div className="city-popup-meta">
        <p>
          Control: <strong>{node.control}</strong>
        </p>
        <p>Terrain: {node.type}</p>
      </div>

      <div className="city-popup-bars">
        <div className="popup-meter">
          <span>Defense</span>
          <div className="meter-shell">
            <div className="meter-fill" style={{ width: `${node.defenseValue}%`, background: toneColor(node.defenseValue, "utility") }} />
          </div>
        </div>

        <div className="popup-meter">
          <span>Transport</span>
          <div className="meter-shell">
            <div className="meter-fill" style={{ width: `${node.transportValue}%`, background: toneColor(node.transportValue, "utility") }} />
          </div>
        </div>

        <div className="popup-meter">
          <span>Supply</span>
          <div className="meter-shell">
            <div className="meter-fill" style={{ width: `${node.supplyValue}%`, background: toneColor(node.supplyValue, "utility") }} />
          </div>
        </div>
      </div>

      <p>
        Current units: {unitSummary}
      </p>

      {city === "paris" && game.railwayCongestion > 90 && (
        <p className="warning">Taxi is free and run normally across Paris despite extreme rail congestion.</p>
      )}

      {city === "paris" && game.cityVehiclesDiscovered && !game.cityVehiclesUsed && (
        <p className="warning">City vehicles discovered. Use a text command to requisition transport.</p>
      )}
    </section>
  );
}
