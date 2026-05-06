// app/page.tsx
"use client";

import {useEffect, useState} from "react";
import {BattleTimeline} from "@/components/BattleTimeline";
import {CityPopup, cityTitles} from "@/components/CityPopup";
import {CommandPanel} from "@/components/CommandPanel";
import {DraggableWindow} from "@/components/DraggableWindow";
import {EndingPanel} from "@/components/EndingPanel";
import {MapCanvas} from "@/components/MapCanvas";
import {BottomThreatBar, RightMetrics} from "@/components/TopStatusBar";
import {useGameStore} from "@/lib/gameState";
import Image from "next/image";
import JosephJoffre from "@/assets/img/JosephJoffre.png";
import FranceFlag from "@/assets/img/Flag_of_France.svg";
import {AllowedAction, Point} from "@/types";

const UI_SCALE = 0.9;
const CITY_WINDOW_OFFSET = {x: 16, y: 16};
const CITY_WINDOW_FALLBACK_POSITION = {x: 590, y: 286};

export default function Page() {
    const {
        game,
        ending,
        selectedNodeId,
        pendingCommands,
        aiStatusText,
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
        reset
    } = useGameStore();

    const [selectedAction, setSelectedAction] = useState<AllowedAction>("DEFEND");
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

    return (
        <main className="viewport-frame">
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
                        setAction={setSelectedAction}
                        enqueueCommand={enqueueCommand}
                        mobilizeCityVehicles={mobilizeCityVehicles}
                    />
                </aside>

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
        </main>
    );
}
