import assert from 'node:assert/strict';
import '../game-core.js';
import {newJourney,readJourney,VILLAGES,village} from '../src/adventure-data.js';
import {readEquipment,buyEquipment,equipItem,equipmentState,BAGS,bestOwnedBag} from '../src/equipment.js';
import {inventoryItemDetails} from '../src/inventory-details.js';
import {inventoryPanel,shopContent} from '../src/equipment-ui.js';
import {villageSidequests} from '../src/journey-story.js';
import {villageMapMarkup} from '../src/village-map.js';
import {planVillageCivic} from '../src/village-civic.js';
import {planVillageExits} from '../src/village-exits.js';
import {REGIONS,regionMetrics} from '../src/adventure-world.js';

const save=newJourney();save.village='water';save.gold=1500;save.equipment.ammo.iron=5;
assert.ok(buyEquipment(save,'pouch-240').ok);assert.equal(equipmentState(save).bag.capacity,50);const gold=save.gold;
for(const id of ['pouch-60','pouch-120','pouch-240'])assert.equal(buyEquipment(save,id).ok,false,id+' cannot buy a lower/equal tier');
assert.equal(save.gold,gold);assert.equal(equipItem(save,'bag','pouch-30'),false);assert.equal(equipItem(save,'bag','pouch-240'),true);
save.equipment.bag='pouch-30';assert.equal(equipmentState(save).bag.capacity,50);assert.equal(save.equipment.bag,'pouch-240');
const migrated=readEquipment({...save.equipment,bag:'pouch-30',ownedBags:BAGS.map(b=>b.id),ammo:{iron:20,steel:10,tempered:10,chakra:10}});
assert.equal(migrated.bag,'pouch-240');assert.equal(Object.values(migrated.ammo).reduce((a,b)=>a+b,0),50);assert.deepEqual(readEquipment(migrated),migrated);
assert.equal(bestOwnedBag({ownedBags:['invalid']}).capacity,10);assert.equal(readJourney({getItem:()=>JSON.stringify({...save,equipment:migrated})}).equipment.bag,'pouch-240');
assert.ok(!inventoryPanel(save).includes('data-kind="bag"'));assert.ok(!inventoryPanel(save).includes('id="gearDetail"'));
const bagShop=shopContent(save,'bag');assert.equal((bagShop.match(/data-buy=/g)||[]).length,3);assert.equal((bagShop.match(/data-buy="[^"]+" disabled/g)||[]).length,3);

save.equipment.ownedArmor.push('water-guard');save.equipment.ownedArmguards.push('water-bracers');
const armor=inventoryItemDetails(save,'armor','water-guard');assert.equal(armor.action,'equip');assert.equal(armor.equipped,false);assert.ok(armor.html.includes('Áo nhẫn giả lữ hành'));assert.equal(save.equipment.armor,'traveler','inspection never equips');
assert.equal(inventoryItemDetails(save,'armguard','water-bracers').action,'equip');assert.equal(inventoryItemDetails(save,'armor','unknown'),null);
assert.equal(inventoryItemDetails(save,'armor','traveler').equipped,true);assert.equal(inventoryItemDetails(save,'shuriken','iron').action,'equip');
assert.equal(inventoryItemDetails(save,'bag','pouch-30').action,null);assert.ok(inventoryItemDetails(save,'bag','pouch-30').html.includes('50'));
save.flask={owned:true,upgrades:2,charges:1};assert.ok(inventoryItemDetails(save,'flask','healing-flask').html.includes('37.5%'));
save.progression.books.push('fire-barrier');assert.equal(inventoryItemDetails(save,'book','fire-barrier').action,'progression');
const quest=villageSidequests('nameless').find(q=>q.type==='retrieve');save.story.questItems.push(quest.id,'fire:hong-lien','fire:lotus-medicine');
assert.ok(inventoryItemDetails(save,'quest',quest.id).html.includes(quest.giverName));assert.ok(inventoryItemDetails(save,'quest','fire:hong-lien').html.includes('Hạ Ly'));assert.equal(inventoryItemDetails(save,'quest','unknown'),null);

for(const v of VILLAGES){
  const civic=planVillageCivic(v.id),region=REGIONS[v.id],gates=planVillageExits(v,village),map=villageMapMarkup({id:v.id,region,limit:regionMetrics(v.id).limit,gates,civic,hero:{x:0,z:7}});
  assert.equal(map.markers.filter(m=>m.type==='landmark').length,region.zones.length);
  assert.equal(map.markers.filter(m=>m.type==='gate'||m.type==='dock').length,v.links.length);
  for(const zone of region.zones)assert.ok(map.markers.some(m=>m.id==='zone:'+zone.id&&m.label===zone.name));
  for(const gate of gates)assert.ok(map.markers.some(m=>m.id==='gate:'+gate.id&&m.label.includes(gate.label)));
  for(const m of map.markers){assert.ok(m.x>=0&&m.x<=900&&m.y>=0&&m.y<=900);assert.ok(m.labelBox.x>=0&&m.labelBox.y>=0&&m.labelBox.x+m.labelBox.w<=900&&m.labelBox.y+m.labelBox.h<=900);}
  assert.ok(map.svg.includes('village-map-hero'));
}
console.log('PASS: all inventory categories provide details without equipping; permanent best-bag migration and downgrade rejection; all ten village maps label every landmark and exit.');
