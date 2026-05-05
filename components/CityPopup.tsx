import {CityId, GameStateData} from "@/types";

export const cityTitles: Record<CityId, string> = {
    paris: "Paris (Capital)",
    meaux: "Meaux",
    chateauThierry: "Château-Thierry",
    marne: "Marne River Sector",
    verdun: "Verdun",
    reims: "Reims"
};

const cityControllers: Record<CityId, string> = {
    paris: "France",
    meaux: "Contested",
    chateauThierry: "Contested",
    marne: "Contested",
    verdun: "France",
    reims: "France"
};

const cityValue: Record<CityId, number> = {
    paris: 5,
    meaux: 4,
    chateauThierry: 4,
    marne: 4,
    verdun: 4,
    reims: 3
};

export function CityPopup({
                              city,
                              game,
                              onDispatch,
                              onMobilize
                          }: {
    city: CityId | null;
    game: GameStateData;
    onDispatch: () => void;
    onMobilize: () => void;
}) {
    if (!city) return null;

    const threat = city === "paris" ? game.parisThreat : Math.round((game.germanAdvance + game.parisThreat) / 2);
    const defenseDots = Math.max(1, Math.min(5, Math.round((game.commandCohesion + game.supply) / 40)));

    return (
        <section className="city-popup">
            <p style={{margin: "auto"}}>
                City status: <strong>{threat > 75 ? "High Threat" : threat > 50 ? "Elevated" : "Guarded"}</strong>
            </p>
            <div className="popup-meter">
                <span>Threat</span>
                <div className="meter-shell">
                    <div className="meter-fill" style={{width: `${threat}%`, background: "#b1493f"}}/>
                </div>
            </div>
            <p>
                Defense rating: {Array.from({length: 5}).map((_, index) => (
                <span key={index} className={`dot ${index < defenseDots ? "dot-on" : ""}`}>●
          </span>
            ))}
            </p>
            <p>Controller: {cityControllers[city]}</p>
            <p>
                Strategic value: {"★".repeat(cityValue[city])}
                {"☆".repeat(5 - cityValue[city])}
            </p>
            <p className="warning">Loss of this node sharply raises campaign failure risk.</p>
            <div className="popup-actions">
                <button>View Details</button>
                <button onClick={onDispatch}>Dispatch Forces</button>
            </div>
            {city === "paris" && game.cityVehiclesDiscovered && !game.cityVehiclesUsed && (
                <button className="mobilize-inline" onClick={onMobilize}>
                    Requisition City Vehicles
                </button>
            )}
        </section>
    );
}
