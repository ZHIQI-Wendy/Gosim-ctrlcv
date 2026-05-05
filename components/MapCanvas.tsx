"use client";

import {cityNodes} from "@/data/mockGameState";
import {CityId} from "@/types";

export function MapCanvas({
                              selectedCity,
                              parisThreat,
                              germanAdvance,
                              flankGap,
                              onCitySelect
                          }: {
    selectedCity: CityId | null;
    parisThreat: number;
    germanAdvance: number;
    flankGap: number;
    onCitySelect: (city: CityId) => void;
}) {
    return (
        <section className="map-canvas" aria-label="Battlefield map">
            <svg viewBox="0 0 1920 1080" className="map-svg" preserveAspectRatio="xMidYMid slice">
                <defs>
                    <pattern id="paperGrain" width="12" height="12" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#d6bf92" opacity="0.25"/>
                        <circle cx="8" cy="6" r="1" fill="#caa974" opacity="0.22"/>
                        <circle cx="6" cy="10" r="1" fill="#ab8a5f" opacity="0.16"/>
                    </pattern>
                    <pattern id="hatch" width="16" height="16" patternUnits="userSpaceOnUse"
                             patternTransform="rotate(20)">
                        <line x1="0" y1="0" x2="0" y2="16" stroke="#4c2f1f" strokeWidth="3" opacity="0.38"/>
                    </pattern>
                    <radialGradient id="fog" cx="55%" cy="40%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0"/>
                        <stop offset="100%" stopColor="#2a2118" stopOpacity="0.45"/>
                    </radialGradient>
                </defs>

                <rect width="1920" height="1080" fill="#bda275"/>
                <rect width="1920" height="1080" fill="url(#paperGrain)"/>

                <path d="M130 260 C420 220, 620 260, 920 300 C1100 322, 1300 335, 1660 330" stroke="#6e8479"
                      strokeWidth="10" fill="none" opacity="0.7"/>
                <path d="M240 560 C560 520, 720 560, 980 610 C1180 650, 1460 650, 1780 610" stroke="#6e8479"
                      strokeWidth="6" fill="none" opacity="0.5"/>

                <path d="M240 840 L710 610 L1090 680 L1510 470" stroke="#5f4d33" strokeWidth="7" fill="none"
                      strokeDasharray="16 12" opacity="0.65"/>
                <path d="M160 730 L540 430 L930 470 L1260 250 L1720 300" stroke="#5f4d33" strokeWidth="5" fill="none"
                      strokeDasharray="10 10" opacity="0.48"/>

                <path d="M130 610 C300 500, 530 460, 730 480 C980 510, 1180 600, 1360 700" stroke="#29211a"
                      strokeWidth="8" fill="none"/>

                <path d="M1100 200 C980 250, 900 320, 860 420" stroke="#b23d30" strokeWidth="10" fill="none"
                      strokeDasharray="20 12"/>
                <polygon points="845,425 900,410 873,462" fill="#b23d30"/>
                <path d="M650 760 C740 700, 840 630, 960 590" stroke="#2f4f8f" strokeWidth="10" fill="none"
                      strokeDasharray="20 12"/>
                <polygon points="968,590 918,580 936,630" fill="#2f4f8f"/>

                <rect x="920" y="360" width="290" height="230" fill="url(#hatch)" opacity="0.75"/>
                <rect x="920" y="360" width="290" height="230" fill="none" stroke="#4f3020" strokeWidth="4"/>
                <text x="945" y="410" fill="#311f14" fontSize="30" fontFamily="Georgia">Marne Gap / High Risk</text>

                <rect x="560" y="520" width="24" height="24" fill="#2f4f8f"/>
                <rect x="610" y="500" width="24" height="24" fill="#2f4f8f"/>
                <rect x="1080" y="400" width="24" height="24" fill="#b23d30"/>
                <rect x="1140" y="380" width="24" height="24" fill="#b23d30"/>

                <text x="1220" y="110" fill="#2d2116" fontSize="35" fontFamily="Georgia">German
                    Advance: {Math.round(germanAdvance)}</text>
                <text x="1220" y="160" fill="#2d2116" fontSize="32" fontFamily="Georgia">Paris
                    Threat: {Math.round(parisThreat)}</text>
                <text x="1220" y="210" fill="#2d2116" fontSize="30" fontFamily="Georgia">Flank
                    Gap: {Math.round(flankGap)}</text>

                <rect width="1920" height="1080" fill="url(#fog)"/>
            </svg>

            {cityNodes.map((city) => {
                const active = selectedCity === city.id;
                return (
                    <button
                        key={city.id}
                        className={`city-node ${active ? "active" : ""} ${city.id === "paris" ? "paris" : ""}`}
                        style={{left: `${city.x}%`, top: `${city.y}%`}}
                        onClick={() => onCitySelect(city.id)}
                    >
                        <span className="city-dot"/>
                        <span className="city-label">{city.label}</span>
                    </button>
                );
            })}
        </section>
    );
}
