// app/page.tsx
"use client";

import {useEffect, useState} from "react";
import {BattleTimeline} from "@/components/BattleTimeline";
import {CityPopup, cityTitles} from "@/components/CityPopup";
import {CommandPanel} from "@/components/CommandPanel";
import {DemoAutorun} from "@/components/DemoAutorun";
import {DraggableWindow} from "@/components/DraggableWindow";
import {EndingPanel} from "@/components/EndingPanel";
import {MapCanvas} from "@/components/MapCanvas";
import {BottomThreatBar, RightMetrics} from "@/components/TopStatusBar";
import {GAME_CONFIG} from "@/lib/config/gameConfig";
import {useGameStore} from "@/lib/gameState";
import Image from "next/image";
import JosephJoffre from "@/assets/img/JosephJoffre.png";
import FranceFlag from "@/assets/img/Flag_of_France.svg";
import {AllowedAction, Point} from "@/types";

const UI_SCALE = 0.9;
const CITY_WINDOW_OFFSET = {x: 16, y: 16};
const CITY_WINDOW_FALLBACK_POSITION = {x: 590, y: 286};
const DEMO_AUTORUN = process.env.NEXT_PUBLIC_DEMO_AUTORUN === "1";

export default function Page() {
    const {
        game,
        ending,
        selectedNodeId,
        pendingCommands,
        aiStatusText,
        activeReportModal,
        isPaused,
        speedLevel,
        runTick,
        decreaseSpeed,
        increaseSpeed,
        togglePause,
        enqueueCommand,
        selectNode,
        closeNode,
        mobilizeCityVehicles,
        dismissActiveReport,
        reset
    } = useGameStore();

    const [selectedAction, setSelectedAction] = useState<AllowedAction>("DEFEND");
    const [demoInput, setDemoInput] = useState("");
    const [cityWindowPosition, setCityWindowPosition] = useState(CITY_WINDOW_FALLBACK_POSITION);

    useEffect(() => {
        const id = setInterval(() => {
            void runTick(0.05);
        }, 50);
        return () => clearInterval(id);
    }, [runTick]);

    const queueSize = pendingCommands.length + game.orderQueue.length;

    const handleNodeSelect = (nodeId: keyof typeof cityTitles, point: Point) => {
        setCityWindowPosition({
            x: point.x / UI_SCALE + CITY_WINDOW_OFFSET.x,
            y: point.y / UI_SCALE + CITY_WINDOW_OFFSET.y
        });
        selectNode(nodeId);
    };

    const pendingAgents = Object.entries(game.pendingAgentState).filter(
        ([name, agent]) => agent.pending && GAME_CONFIG.pendingEffectAgents.includes(name as typeof GAME_CONFIG.pendingEffectAgents[number])
    );
    const hasPendingAgents = pendingAgents.length > 0;

    return (
        <main className={`viewport-frame ${hasPendingAgents || activeReportModal ? "is-pending" : ""}`}>
            <div className="war-room">
                <MapCanvas game={game} selectedNode={selectedNodeId} onNodeSelect={handleNodeSelect}/>

                <BottomThreatBar game={game}/>

                <RightMetrics
                    game={game}
                    isPaused={isPaused}
                    speedLevel={speedLevel}
                    onTogglePause={togglePause}
                    onDecreaseSpeed={decreaseSpeed}
                    onIncreaseSpeed={increaseSpeed}
                />

                <aside className="commander-card" aria-label="French commander">
                    <Image className="commander-photo" src={JosephJoffre} alt="General Joseph Joffre"/>
                    <div className="commander-caption">
                        <Image src={FranceFlag} alt="French flag" width={20} height={14}/>
                        <span>Joseph Joffre</span>
                    </div>
                </aside>

                <aside className="strategy-sidebar">
                    <CommandPanel
                        selectedAction={selectedAction}
                        queueSize={queueSize}
                        reports={game.reports}
                        disabled={Boolean(ending)}
                        aiStatusText={aiStatusText}
                        cityVehiclesDiscovered={game.cityVehiclesDiscovered}
                        cityVehiclesUsed={game.cityVehiclesUsed}
                        inputValue={demoInput}
                        setAction={setSelectedAction}
                        setInputValue={setDemoInput}
                        enqueueCommand={enqueueCommand}
                        mobilizeCityVehicles={mobilizeCityVehicles}
                    />
                </aside>

                {DEMO_AUTORUN ? <DemoAutorun setDemoInput={setDemoInput}/> : null}

                <DraggableWindow
                    id="city-panel"
                    label={selectedNodeId ? cityTitles[ selectedNodeId] : "City"}
                    visible={Boolean(selectedNodeId)}
                    defaultPosition={cityWindowPosition}
                    className="city-window"
                    onClose={closeNode}
                >
                    <CityPopup city={selectedNodeId} game={game}/>
                </DraggableWindow>

                <BattleTimeline reports={game.reports}/>

                <EndingPanel ending={ending} onReset={reset}/>
            </div>
            {hasPendingAgents && (
                <div className="pending-overlay" aria-live="polite" aria-busy="true">
                    <div className="pending-card floating-panel">
                        <span className="decision-spinner" aria-hidden />
                        <strong>Agents pending</strong>
                        <p>{pendingAgents.map(([name]) => name).join(", ")}</p>
                    </div>
                </div>
            )}
            {activeReportModal && (
                <button className="pending-overlay" onClick={dismissActiveReport} type="button">
                    <div className="pending-card floating-panel">
                        <strong>{activeReportModal.headline}</strong>
                        <p>{activeReportModal.reportText}</p>
                        {activeReportModal.advisorLine ? <small>{activeReportModal.advisorLine}</small> : null}
                    </div>
                </button>
            )}
        </main>
    );
}
