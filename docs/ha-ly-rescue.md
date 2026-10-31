# Hạ Ly: lightweight model and rescue

`assets/ha-ly-simple.glb` has 16,095 triangles, down from 47,296 (66%).
Dense hair cards are replaced with solid locks and a scalp cap; clothing is
decimated while preserving UVs, skin weights and facial expressions.
The derived GLB is 6.09 MB. Unused normal maps, matcaps, the preview thumbnail
and 52 unused morph targets are removed; the five expressions used by the
game and the source attribution/license metadata remain.
The original baked `ha-ly.glb` remains unchanged. Regeneration requires the
original **rigged** user-supplied VRM, not the baked GLB:

```powershell
& '.tools/blender-4.5.9-windows-x64/blender.exe' --background --python tools/build-ha-ly.py -- --source 'C:/Users/HUNG/Downloads/hehe.vrm'
```

`src/ha-ly-model.js` loads a separate skinned clone per character, replaces
unlit surfaces with lit toon materials, warms skin, mutes clothing and excludes
facial details from outlines. Captive/wounded poses bend the hips and knees,
lower the head and place hands at the injury with arm IK. Skirt bones fold
with the seated pose. After recruitment, the shared character gait drives
her hips, knees, ankles and arms while following the player.

The Fire chapter keeps four save-compatible stages:

1. Meet **Bà Hồng**, Hạ Ly's adoptive mother, by Fire Village's gate and accept
   the rescue mission.
2. Go to the prison west of the gate (world center `-12,20`) and defeat both
   Black Robe jailers. Hạ Ly is already visible inside, wounded and bound.
3. Victory opens the physical cell gate and removes her wrist bonds. Retrieve
   Fireheart medicine from the marked residential approach.
4. Return to the cell, treat her and invite her along. Hạ Ly becomes a walking
   companion; the open, empty prison and her grateful mother remain.

Prison walls and the locked gate block movement and pathfinding. Story refresh
removes old colliders before rebuilding; travel removes the prison completely.
Existing completed Fire saves keep their companion and rewards. No progress is
reset to replay the revised opening.

Validation: `npm run test:ha-ly`. Native tests cover all 36 village objectives,
gate collision/unlocking, refresh and travel cleanup, rewards and saved progress.
Browser tests load the actual GLB, verify lit materials and seated joints, render
all prison stages and play the full rescue through combat, medicine, reload,
recruitment, walking and cross-village travel. Captures: `test-results/ha-ly-rescue`.
