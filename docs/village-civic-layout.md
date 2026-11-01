# Village council halls and neighborhoods

The nine elemental villages use separated estates. Nameless keeps its
existing houses, chief, family home, cemetery, landmarks, gates and map size.
Light and Dark now share the other elemental villages' 280 × 280 world area.

Each elemental village has twenty cottages, spaced at least 22 units apart,
across a residential zone covering about 48% of the map, excluding estate
overlap. Commerce is inside this zone. The school opens training; the clinic
refills an owned healing flask. The existing named healer stands by the clinic.
Local footpaths follow the collision map, connecting cottages to the market.

Council, school, clinic and military estates have graded courtyards, boundary
walls and open gates. They are distributed across the village. The school has
the largest plot (84 by 92), a three-storey main building, two three-storey
classroom wings, a two-storey functional building, a four-storey dormitory and
a broad training/assembly yard. The clinic includes a medical ward and pharmacy.

The council hall contains the chief, meeting
table, archive and private sleeping area. Press E outside its door to enter a
separate interior scene, using the same transfer/save/exit mechanism as the
Earth cave. Chief quests and peace negotiations work inside. Campaign and quest
markers point to the entrance from outside and to the chief from inside.

Hall silhouettes are distinct: Water timber stilts, Fire basalt and chimneys,
Lightning a conductor tower, Earth a sandstone fort, Wind a round pavilion,
Light a domed colonnade, Ice a snow lodge, Wood living timber and Dark a tiered
moon pagoda. The guardian occupies the enclosed courtyard and remains after
being defeated; guardian sentries stay inside the same walls. Each gate has two watchtowers
and a visible gate guard. Gate guards reuse existing sentry IDs, preserving
victories in old saves; the remaining regular sentries retain their disguises.

`village-civic.js` plans bounded, dry plots deterministically. The plan is
cached independently of rewards and defeated enemies, so houses and the market
do not change position after battles. Landmarks replaced by an estate are
removed; surviving landmarks keep their original style. Quest-giver IDs and
rewards survive: displaced residents move near cottages, and mentor exploration
requirements use remaining landmarks. The Earth cave, Wood arena and Fire
volcano are protected. Border gates and travel arrivals share the same clear
position. Water navigation checks actual walking paths between ferry docks.
The combat-return scene reuse introduced earlier remains in place.

The military estate is adjacent to the council hall, outside its courtyard
walls. It contains barracks, a store, a prison and two jailers. Fire's Ha Ly
cell is here; her mother waits outside the military gate and medicine is in
the residential market. Jailers trigger the authored rescue battle during its
combat stage. Victory removes them without rebuilding the map and opens the
cell; the medicine and recruitment sequence continues as before.

Save world revision 3 doubles old Light/Dark outdoor coordinates once, preserving
quest, item and progression data. Council visits retain the exact exterior
return position, surface and elevation. Older council visits without layout
revision 2 return to the relocated exterior door.

Run `npm run test:civic` for all nine layouts, hall access/exit/reload, chiefs,
guardians, schools, clinics, gates, save migration and live browser rendering.
