// Keep the 10% no-G baseline, then double each rounded opponent health value.
export const BOT_HEALTH_MULTIPLIER=1.1;
export const BOT_HEALTH_SCALE=2;
export const botHealth=base=>Math.round(base*BOT_HEALTH_MULTIPLIER)*BOT_HEALTH_SCALE;
export const PRACTICE_BOT_HP=botHealth(200);
