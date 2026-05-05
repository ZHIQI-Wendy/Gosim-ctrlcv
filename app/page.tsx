"use client";

import {useEffect, useMemo, useState} from "react";
import {BattleTimeline} from "@/components/BattleTimeline";
import {CityPopup, cityTitles} from "@/components/CityPopup";
import {CommandPanel} from "@/components/CommandPanel";
import {DraggableWindow} from "@/components/DraggableWindow";
import {EndingPanel} from "@/components/EndingPanel";
import {MapCanvas} from "@/components/MapCanvas";
import {MechanicHint} from "@/components/MechanicHint";
import {TopStatusBar} from "@/components/TopStatusBar";
import {useGameStore} from "@/lib/gameState";
import Image from "next/image";
import JosephJoffre from "@/assets/img/JosephJoffre.png";
import FranceFlag from "@/assets/img/Flag_of_France.svg";

type PanelKey = "city";

const defaultPanels: Record<PanelKey, boolean> = {
    city: true
};

export default function Page() {
    const {
        game,
        orderQueue,
        reports,
        selectedFocus,
        selectedCity,
        isPaused,
        speedLevel,
        runTick,
        decreaseSpeed,
        increaseSpeed,
        togglePause,
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
            runTick(3);
        }, 3000);
        return () => clearInterval(id);
    }, [runTick]);

    const panelToggles = useMemo(
        () => [
            {key: "city", label: "City", open: openPanels.city}
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
                    onDecreaseSpeed={decreaseSpeed}
                    onIncreaseSpeed={increaseSpeed}
                    onTogglePanel={togglePanel}
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
                        selectedFocus={selectedFocus}
                        queueSize={orderQueue.length}
                        reports={reports}
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
                    label={selectedCity ? `${cityTitles[selectedCity]}` : "City"}
                    visible={openPanels.city && Boolean(selectedCity)}
                    defaultPosition={{x: 590, y: 286}}
                    className="city-window"
                    onClose={() => closePanel("city")}
                >
                    <CityPopup city={selectedCity} game={game} onDispatch={dispatchCityForces}
                               onMobilize={mobilizeCityVehicles}/>
                </DraggableWindow>

                <BattleTimeline reports={reports}/>

                <EndingPanel ending={game.ending} onReset={reset}/>
            </div>
        </main>
    );
}
