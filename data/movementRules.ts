export const PX_TO_KM = 0.2;

export const MOVEMENT_RULES = {
  rail: {
    speedKmh: 22,
    lineClass: "move-line-rail",
    riverCrossingDelayHours: 0.25,
    description: "Fast strategic movement along railway. Requires rail node access."
  },

  road: {
    speedKmh: 4.5,
    lineClass: "move-line-road",
    riverCrossingDelayHours: 0.75,
    description: "Standard marching movement along roads."
  },

  field: {
    speedKmh: 1.8,
    lineClass: "move-line-field",
    riverCrossingDelayHours: 3,
    description: "Direct off-road movement. Shorter path, slower speed."
  },

  river_crossing: {
    speedKmh: 1,
    lineClass: "move-line-river-crossing",
    riverCrossingDelayHours: 5,
    description: "Forced crossing without proper bridge control."
  },

  city_vehicle: {
    speedKmh: 12,
    lineClass: "move-line-city-vehicle",
    riverCrossingDelayHours: 0.5,
    description: "Urban or near-urban vehicle movement near Paris."
  }
} as const;
