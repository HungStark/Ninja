// Compensate for removing G from every AI opponent; player health is unchanged.
export const BOT_HEALTH_MULTIPLIER=1.1;
export const botHealth=base=>Math.round(base*BOT_HEALTH_MULTIPLIER);
export const PRACTICE_BOT_HP=botHealth(200);
