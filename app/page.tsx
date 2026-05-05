"use client";

import {useEffect, useMemo, useState} from "react";
import {AgentPanel} from "@/components/AgentPanel";
import {BattleTimeline} from "@/components/BattleTimeline";
import {CityPopup} from "@/components/CityPopup";
import {CommandPanel} from "@/components/CommandPanel";
import {DraggableWindow} from "@/components/DraggableWindow";
import {EndingPanel} from "@/components/EndingPanel";
import {EndingPreview} from "@/components/EndingPreview";
import {KnowledgeCard} from "@/components/KnowledgeCard";
import {LegendPanel} from "@/components/LegendPanel";
import {MapCanvas} from "@/components/MapCanvas";
import {MechanicHint} from "@/components/MechanicHint";
import {TopStatusBar} from "@/components/TopStatusBar";
import {useGameStore} from "@/lib/gameState";

type PanelKey = "legend" | "city" | "timeline" | "knowledge" | "mechanic" | "agent" | "ending";

const defaultPanels: Record<PanelKey, boolean> = {
    legend: true,
    city: true,
    timeline: true,
    knowledge: true,
    mechanic: true,
    agent: true,
    ending: true
};

export default function Page() {
    const {
        game,
        orderQueue,
        reports,
        cards,
        agentLines,
        selectedFocus,
        selectedCity,
        isPaused,
        speedLevel,
        runTick,
        stepTick,
        togglePause,
        setSpeedLevel,
        setFocus,
        enqueueCommand,
        selectCity,
        closeCityPopup,
        mobilizeCityVehicles,
        dispatchCityForces,
        reset
    } = useGameStore();

    const [openPanels, setOpenPanels] = useState<Record<PanelKey, boolean>>(defaultPanels);

    useEffect(() => {
        const id = setInterval(() => {
            runTick(1);
        }, 1000);
        return () => clearInterval(id);
    }, [runTick]);

    const panelToggles = useMemo(
        () => [
            {key: "legend", label: "Legend", open: openPanels.legend},
            {key: "city", label: "City", open: openPanels.city},
            {key: "timeline", label: "Timeline", open: openPanels.timeline},
            {key: "knowledge", label: "Knowledge", open: openPanels.knowledge},
            {key: "mechanic", label: "Mechanic", open: openPanels.mechanic},
            {key: "agent", label: "Agent", open: openPanels.agent},
            {key: "ending", label: "Ending", open: openPanels.ending}
        ],
        [openPanels]
    );

    const togglePanel = (key: string) => {
        const panelKey = key as PanelKey;
        setOpenPanels((prev) => ({...prev, [panelKey]: !prev[panelKey]}));
        if (panelKey === "city" && !openPanels.city && !selectedCity) {
            selectCity("paris");
        }
    };

    const closePanel = (panel: PanelKey) => {
        setOpenPanels((prev) => ({...prev, [panel]: false}));
        if (panel === "city") {
            closeCityPopup();
        }
    };

    return (
        <main className="viewport-frame">
            <div className="war-room">
                <MapCanvas
                    selectedCity={selectedCity}
                    parisThreat={game.parisThreat}
                    germanAdvance={game.germanAdvance}
                    flankGap={game.flankGap}
                    onCitySelect={(city) => {
                        selectCity(city);
                        setOpenPanels((prev) => ({...prev, city: true}));
                    }}
                />

                <TopStatusBar
                    game={game}
                    isPaused={isPaused}
                    speedLevel={speedLevel}
                    panelToggles={panelToggles}
                    onTogglePause={togglePause}
                    onStep={stepTick}
                    onSetSpeed={setSpeedLevel}
                    onTogglePanel={togglePanel}
                />

                <DraggableWindow
                    id="legend-panel"
                    label="Legend"
                    visible={openPanels.legend}
                    defaultPosition={{x: 22, y: 128}}
                    className="legend-window"
                    onClose={() => closePanel("legend")}
                >
                    <LegendPanel/>
                </DraggableWindow>

                <aside className="floating-panel strategy-sidebar">
                    <CommandPanel
                        selectedFocus={selectedFocus}
                        queueSize={orderQueue.length}
                        disabled={Boolean(game.ending)}
                        cityVehiclesDiscovered={game.cityVehiclesDiscovered}
                        cityVehiclesUsed={game.cityVehiclesUsed}
                        setFocus={setFocus}
                        enqueueCommand={enqueueCommand}
                        mobilizeCityVehicles={mobilizeCityVehicles}
                    />
                </aside>

                <DraggableWindow
                    id="city-panel"
                    label="City Detail"
                    visible={openPanels.city && Boolean(selectedCity)}
                    defaultPosition={{x: 590, y: 286}}
                    className="city-window"
                    onClose={() => closePanel("city")}
                >
                    <CityPopup city={selectedCity} game={game} onDispatch={dispatchCityForces}
                               onMobilize={mobilizeCityVehicles}/>
                </DraggableWindow>

                <DraggableWindow
                    id="timeline-panel"
                    label="Battle Timeline"
                    visible={openPanels.timeline}
                    defaultPosition={{x: 22, y: 720}}
                    className="timeline-window"
                    onClose={() => closePanel("timeline")}
                >
                    <BattleTimeline reports={reports}/>
                </DraggableWindow>

                <DraggableWindow
                    id="knowledge-panel"
                    label="Historical Knowledge"
                    visible={openPanels.knowledge}
                    defaultPosition={{x: 22, y: 910}}
                    className="knowledge-window"
                    onClose={() => closePanel("knowledge")}
                >
                    <KnowledgeCard cards={cards}/>
                </DraggableWindow>

                <DraggableWindow
                    id="mechanic-panel"
                    label="Hidden Mechanic"
                    visible={openPanels.mechanic && game.cityVehiclesDiscovered}
                    defaultPosition={{x: 780, y: 864}}
                    className="mechanic-window"
                    onClose={() => closePanel("mechanic")}
                >
                    <MechanicHint discovered={game.cityVehiclesDiscovered} onOpen={() => selectCity("paris")}/>
                </DraggableWindow>

                <DraggableWindow
                    id="agent-panel"
                    label="Agent Interaction"
                    visible={openPanels.agent}
                    defaultPosition={{x: 1240, y: 684}}
                    className="agent-window"
                    onClose={() => closePanel("agent")}
                >
                    <AgentPanel lines={agentLines}/>
                </DraggableWindow>

                <DraggableWindow
                    id="ending-preview-panel"
                    label="Outcome Convergence"
                    visible={openPanels.ending}
                    defaultPosition={{x: 1240, y: 904}}
                    className="ending-window"
                    onClose={() => closePanel("ending")}
                >
                    <EndingPreview game={game}/>
                </DraggableWindow>

                <EndingPanel ending={game.ending} onReset={reset}/>
            </div>
        </main>
    );
}
