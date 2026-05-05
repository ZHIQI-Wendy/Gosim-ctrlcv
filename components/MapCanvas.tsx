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

                <path d="M1260 220 C1160 250, 1030 300, 945 382 C905 420, 910 470, 980 530" stroke="#b23d30"
                      strokeWidth="8" fill="none" strokeDasharray="16 12" opacity="0.86"/>
                <polygon points="995,536 952,526 970,567" fill="#b23d30" opacity="0.9"/>
                <path d="M1450 248 C1330 290, 1200 350, 1120 460" stroke="#b23d30" strokeWidth="8" fill="none"
                      strokeDasharray="16 12" opacity="0.8"/>
                <polygon points="1112,470 1148,452 1140,492" fill="#b23d30" opacity="0.88"/>
                <path d="M1610 280 C1530 340, 1460 430, 1398 520" stroke="#a45f57" strokeWidth="6" fill="none"
                      strokeDasharray="14 10" opacity="0.45"/>

                <path d="M558 392 C650 392, 758 390, 860 420" stroke="#2f4f8f" strokeWidth="8" fill="none"
                      strokeDasharray="16 12" opacity="0.9"/>
                <polygon points="874,426 834,410 838,448" fill="#2f4f8f"/>
                <path d="M760 640 C760 590, 768 540, 778 486" stroke="#2f4f8f" strokeWidth="8" fill="none"
                      strokeDasharray="16 12" opacity="0.88"/>
                <polygon points="780,470 760,506 800,504" fill="#2f4f8f"/>
                <path d="M880 588 C920 545, 970 505, 1024 470" stroke="#2f4f8f" strokeWidth="7" fill="none"
                      strokeDasharray="14 10" opacity="0.82"/>
                <polygon points="1035,462 996,466 1018,495" fill="#2f4f8f"/>

                <path d="M890 330 L1180 385 L1280 500 L1010 575 L835 500 Z" fill="#d8b447" opacity="0.34"/>
                <path d="M890 330 L1180 385 L1280 500 L1010 575 L835 500 Z" fill="none" stroke="#83662c"
                      strokeWidth="3" strokeDasharray="12 10" opacity="0.7"/>
                <text x="905" y="440" fill="#3c2b11" fontSize="28" fontFamily="Georgia">Potential Gap</text>
                <text x="905" y="476" fill="#3c2b11" fontSize="24" fontFamily="Georgia">Unsecured Frontline</text>

                <rect x="1030" y="310" width="18" height="18" fill="#b23d30"/>
                <rect x="1086" y="340" width="18" height="18" fill="#b23d30"/>
                <rect x="958" y="402" width="18" height="18" fill="#b23d30"/>
                <rect x="1180" y="360" width="18" height="18" fill="#b23d30"/>
                <rect x="1240" y="410" width="18" height="18" fill="#b23d30"/>
                <rect x="1408" y="444" width="16" height="16" fill="#9e6e67" opacity="0.66"/>

                <rect x="590" y="380" width="18" height="18" fill="#2f4f8f"/>
                <rect x="648" y="384" width="18" height="18" fill="#2f4f8f"/>
                <rect x="728" y="620" width="18" height="18" fill="#2f4f8f"/>
                <rect x="788" y="610" width="18" height="18" fill="#2f4f8f"/>
                <rect x="900" y="566" width="18" height="18" fill="#2f4f8f"/>
                <rect x="950" y="550" width="18" height="18" fill="#2f4f8f"/>

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
