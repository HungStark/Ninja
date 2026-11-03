const ELEMENTS=['fire','water','lightning','earth','wind','light','ice','wood','dark'];
export function guardianElementMultipliers(village){
  return ELEMENTS.includes(village)?Object.fromEntries(ELEMENTS.map(element=>[element,element===village?1.1:.9])):{};
}
