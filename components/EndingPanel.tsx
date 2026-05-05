import {OutcomeKey} from "@/types";
import {endingNarrative} from "@/lib/outcome";

export function EndingPanel({ending, onReset}: { ending: OutcomeKey | null; onReset: () => void }) {
    if (!ending) return null;

    return (
        <section className="ending-overlay">
            <div className="floating-panel ending-modal">
            <h2>Scenario Ended</h2>
            <strong>{ending}</strong>
            <p>{endingNarrative[ending]}</p>
            <button onClick={onReset}>Restart Scenario</button>
            </div>
        </section>
    );
}
