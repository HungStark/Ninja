import assert from 'node:assert/strict';
import {SYSTEMS} from '../src/progression.js';
import {shopStock,buyEquipment} from '../src/equipment.js';
import {newJourney} from '../src/adventure-data.js';
for(const village of SYSTEMS){
 const stock=shopStock(village),armor=stock.find(i=>i.kind==='armor'&&i.elite),gloves=stock.find(i=>i.kind==='armguard'&&i.elite);
 assert.equal(armor.price,269,village+' elite armor');assert.equal(gloves.price,199,village+' elite gloves');
 assert.equal(stock.find(i=>i.kind==='armor'&&!i.elite).price,140);assert.equal(stock.find(i=>i.kind==='armguard'&&!i.elite).price,100);
 for(const item of [armor,gloves]){const save=newJourney();save.village=village;save.gold=item.price-1;assert.equal(buyEquipment(save,item.id).ok,false);assert.equal(save.gold,item.price-1);save.gold=item.price;assert.equal(buyEquipment(save,item.id).ok,true);assert.equal(save.gold,0);}
}
assert.equal(shopStock('nameless').some(i=>i.elite),false);
console.log('PASS: all nine regional elite armors cost 269, gloves cost 199; exact-price purchases work and normal gear prices are unchanged.');
