import { MapEdge } from "@/types";

export const MAP_EDGE_LIST: MapEdge[] = [
  {
    id: "paris_paris_rail_hub",
    from: "paris",
    to: "paris_rail_hub",
    modes: ["road", "rail", "city_vehicle"],
    points: [{ x: 160, y: 470 }, { x: 190, y: 455 }],
    riverCrossings: 0,
    capacity: 100,
    notes: "Local Paris rail and vehicle connection."
  },
  {
    id: "paris_meaux",
    from: "paris",
    to: "meaux",
    modes: ["rail", "road", "city_vehicle"],
    points: [{ x: 160, y: 470 }, { x: 255, y: 437 }, { x: 350, y: 400 }],
    riverCrossings: 1,
    capacity: 90,
    notes: "Main Paris-Meaux axis crossing the Marne sector."
  },
  {
    id: "paris_ourcq_line",
    from: "paris",
    to: "ourcq_line",
    modes: ["road", "city_vehicle"],
    points: [{ x: 160, y: 470 }, { x: 220, y: 360 }, { x: 285, y: 320 }],
    riverCrossings: 0,
    capacity: 65,
    notes: "Paris north-eastern route toward Ourcq."
  },
  {
    id: "ourcq_line_meaux",
    from: "ourcq_line",
    to: "meaux",
    modes: ["road", "field"],
    points: [{ x: 285, y: 320 }, { x: 320, y: 360 }, { x: 350, y: 400 }],
    riverCrossings: 1,
    capacity: 55,
    notes: "Ourcq-Meaux local route."
  },
  {
    id: "senlis_ourcq_line",
    from: "senlis",
    to: "ourcq_line",
    modes: ["road", "field"],
    points: [{ x: 160, y: 170 }, { x: 220, y: 250 }, { x: 285, y: 320 }],
    riverCrossings: 1,
    capacity: 60,
    notes: "German right-wing approach toward Ourcq."
  },
  {
    id: "senlis_aisne_road",
    from: "senlis",
    to: "aisne_road",
    modes: ["road", "rail"],
    points: [{ x: 160, y: 170 }, { x: 330, y: 160 }, { x: 500, y: 150 }],
    riverCrossings: 0,
    capacity: 75,
    notes: "Northern road and rail connection."
  },
  {
    id: "aisne_road_reims",
    from: "aisne_road",
    to: "reims",
    modes: ["road", "rail"],
    points: [{ x: 500, y: 150 }, { x: 660, y: 195 }, { x: 860, y: 280 }],
    riverCrossings: 1,
    capacity: 80,
    notes: "Aisne-Reims operational route."
  },
  {
    id: "meaux_marne_crossings",
    from: "meaux",
    to: "marne_crossings",
    modes: ["road", "rail"],
    points: [{ x: 350, y: 400 }, { x: 405, y: 405 }, { x: 455, y: 410 }],
    riverCrossings: 1,
    capacity: 70,
    notes: "Meaux to Marne crossing sector."
  },
  {
    id: "marne_crossings_chateau_thierry",
    from: "marne_crossings",
    to: "chateau_thierry",
    modes: ["road", "rail"],
    points: [{ x: 455, y: 410 }, { x: 535, y: 420 }, { x: 600, y: 430 }],
    riverCrossings: 0,
    capacity: 75,
    notes: "Marne route eastward."
  },
  {
    id: "chateau_thierry_epernay",
    from: "chateau_thierry",
    to: "epernay",
    modes: ["rail", "road"],
    points: [{ x: 600, y: 430 }, { x: 710, y: 441 }, { x: 850, y: 460 }],
    riverCrossings: 0,
    capacity: 85,
    notes: "Main rail and road toward Epernay."
  },
  {
    id: "epernay_chalons",
    from: "epernay",
    to: "chalons",
    modes: ["rail", "road"],
    points: [{ x: 850, y: 460 }, { x: 955, y: 486 }, { x: 1060, y: 510 }],
    riverCrossings: 0,
    capacity: 85,
    notes: "Epernay-Chalons route."
  },
  {
    id: "chalons_bar_le_duc",
    from: "chalons",
    to: "bar_le_duc",
    modes: ["rail", "road"],
    points: [{ x: 1060, y: 510 }, { x: 1170, y: 590 }, { x: 1230, y: 720 }],
    riverCrossings: 0,
    capacity: 75,
    notes: "Eastern rail-road route."
  },
  {
    id: "chalons_verdun",
    from: "chalons",
    to: "verdun",
    modes: ["rail", "road"],
    points: [{ x: 1060, y: 510 }, { x: 1170, y: 470 }, { x: 1280, y: 430 }],
    riverCrossings: 0,
    capacity: 70,
    notes: "Chalons-Verdun route."
  },
  {
    id: "bar_le_duc_verdun",
    from: "bar_le_duc",
    to: "verdun",
    modes: ["rail", "road"],
    points: [{ x: 1230, y: 720 }, { x: 1260, y: 580 }, { x: 1280, y: 430 }],
    riverCrossings: 0,
    capacity: 65,
    notes: "Eastern vertical rail-road route."
  },
  {
    id: "meaux_coulommiers",
    from: "meaux",
    to: "coulommiers",
    modes: ["road", "rail"],
    points: [{ x: 350, y: 400 }, { x: 420, y: 480 }, { x: 480, y: 570 }],
    riverCrossings: 1,
    capacity: 65,
    notes: "Meaux-Coulommiers route."
  },
  {
    id: "coulommiers_montmirail",
    from: "coulommiers",
    to: "montmirail",
    modes: ["road"],
    points: [{ x: 480, y: 570 }, { x: 680, y: 598 }, { x: 860, y: 610 }],
    riverCrossings: 0,
    capacity: 60,
    notes: "Southern road route."
  },
  {
    id: "montmirail_epernay",
    from: "montmirail",
    to: "epernay",
    modes: ["road"],
    points: [{ x: 860, y: 610 }, { x: 852, y: 536 }, { x: 850, y: 460 }],
    riverCrossings: 1,
    capacity: 55,
    notes: "Montmirail-Epernay route."
  },
  {
    id: "montmirail_chateau_thierry",
    from: "montmirail",
    to: "chateau_thierry",
    modes: ["road"],
    points: [{ x: 860, y: 610 }, { x: 760, y: 535 }, { x: 600, y: 430 }],
    riverCrossings: 1,
    capacity: 50,
    notes: "Diagonal road toward Chateau-Thierry."
  },
  {
    id: "montmirail_sezanne",
    from: "montmirail",
    to: "sezanne",
    modes: ["road"],
    points: [{ x: 860, y: 610 }, { x: 800, y: 680 }, { x: 730, y: 760 }],
    riverCrossings: 0,
    capacity: 55,
    notes: "Southern connection."
  },
  {
    id: "sezanne_fere_champenoise",
    from: "sezanne",
    to: "fere_champenoise",
    modes: ["road", "rail"],
    points: [{ x: 730, y: 760 }, { x: 860, y: 705 }, { x: 980, y: 700 }],
    riverCrossings: 0,
    capacity: 60,
    notes: "Southern rail-road connection."
  },
  {
    id: "fere_champenoise_chalons",
    from: "fere_champenoise",
    to: "chalons",
    modes: ["road", "rail"],
    points: [{ x: 980, y: 700 }, { x: 1020, y: 600 }, { x: 1060, y: 510 }],
    riverCrossings: 0,
    capacity: 65,
    notes: "South-eastern route to Chalons."
  }
];
