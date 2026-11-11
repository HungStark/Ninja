// The atlas follows the same element and technique order as the reference sheet.
export const SPELL_ICON_ROWS=[
  ['fire-volley','fire-lance','fire-meteor','fire-barrier','fire-reflect'],
  ['water-lance','water-volley','water-tsunami','water-barrier','water-reflect'],
  ['lightning-lance','lightning-volley','lightning-thunder','lightning-barrier','lightning-reflect'],
  ['wind-orb','wind-volley','wind-lance','wind-barrier','wind-reflect'],
  ['earth-orb','earth-lance','earth-volley','earth-barrier','earth-reflect'],
  ['light-orb','light-barrier','light-lance','light-reflect','light-volley'],
  ['dark-orb','dark-lance','dark-volley','dark-domain','dark-reflect'],
  ['wood-orb','wood-lance','wood-volley','wood-barrier','wood-reflect'],
  ['ice-orb','ice-lance','ice-volley','ice-barrier','ice-reflect']
];
export const SPELL_ART_FILES=Object.fromEntries(SPELL_ICON_ROWS.flat().map(id=>[id,'assets/ui/spells/'+id+'.png']));
