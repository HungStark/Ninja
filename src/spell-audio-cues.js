export function spellCastCue(spell){
 const style=spell.style||'';
 if(['aircombo','boat','lightray','jacob'].includes(style))return null;
 if(style.startsWith('earth'))return null;
 if(style==='guardian-breath')return 'energy-charge';
 if(style==='guardian-slam')return 'guardian-roar';
 if(style==='meteor')return 'meteor-summon';
 if(style==='dragon')return 'dragon-roar';
 if(['thunder','stormfield'].includes(style))return 'static-charge';
 if(['discharge','bird','lance'].includes(style)&&spell.element==='lightning')return 'lightning-crack';
 return {fire:'flame-burst',water:'water-surge',wind:'wind-howl',earth:'rock-shift',light:'light-chime',dark:'shadow-rumble',wood:'wood-creak',ice:'ice-crack'}[spell.element]||null;
}
export function spellImpactCue(spell){
 if(['boat','lightray','jacob','lightdome'].includes(spell.style))return null;
 if(spell.style==='meteor'||spell.style==='ignite')return 'explosion';
 if(spell.style==='thunder')return null;
 if(spell.style==='guardian-slam')return 'stone-impact';
 if(spell.element==='earth')return null;
 if(spell.style==='guardian-breath'||spell.style==='poisontick')return null;
 return {fire:'flame-burst',water:'water-splash',lightning:'lightning-crack',wind:'wind-cut',wood:'wood-snap',ice:'ice-crack',light:'light-chime',dark:'shadow-hit'}[spell.element]||null;
}
