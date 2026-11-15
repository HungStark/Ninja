export const GUARDIAN_NORMAL_REST=1.4;
export const GUARDIAN_ENRAGED_REST=.6;
export const GUARDIAN_ENRAGE_THRESHOLD=.3;
export const guardianRest=enraged=>enraged?GUARDIAN_ENRAGED_REST:GUARDIAN_NORMAL_REST;
export const guardianComboGap=enraged=>enraged?.12:.25;
export const guardianRecovery=(enraged,end)=>end?guardianRest(enraged):guardianComboGap(enraged);
export const guardianIsEnraged=fighter=>fighter.hp/fighter.maxHp<GUARDIAN_ENRAGE_THRESHOLD;
