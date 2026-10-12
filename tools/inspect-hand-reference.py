"""Inspect the user's reference asset without modifying the source GLB."""
import bpy, bmesh, json
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'test-results/hand-reference'
OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'anime_style_hand.glb'))
report=[]
for obj in bpy.context.scene.objects:
    record={'name':obj.name,'type':obj.type,'matrix_world':[list(r) for r in obj.matrix_world]}
    if obj.type=='MESH':
        bm=bmesh.new();bm.from_mesh(obj.data)
        world=[obj.matrix_world@v.co for v in obj.data.vertices]
        record.update(vertices=len(obj.data.vertices),faces=len(obj.data.polygons),
          non_manifold_edges=sum(not e.is_manifold for e in bm.edges),volume=abs(bm.calc_volume()),
          materials=[m.name if m else None for m in obj.data.materials],
          bounds={a:[min(v[i] for v in world),max(v[i] for v in world)] for i,a in enumerate('xyz')},
          groups=[g.name for g in obj.vertex_groups])
        bm.free()
    if obj.type=='ARMATURE':record['bones']=[b.name for b in obj.data.bones]
    report.append(record)
(OUT/'reference-audit.json').write_text(json.dumps(report,indent=2),encoding='utf8')
print('REFERENCE AUDIT',json.dumps(report))
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'reference-import.blend'))

# Normalize only a working copy for a comparable Y-up, dorsal +Z preview.
obj=next(o for o in bpy.context.scene.objects if o.type=='MESH')
world=[obj.matrix_world@v.co for v in obj.data.vertices]
zmin=min(p.z for p in world);zmax=max(p.z for p in world)
scale=.430/(zmax-zmin)
obj.parent=None;obj.matrix_world.identity()
for v,p in zip(obj.data.vertices,world):
    v.co=Vector((-p.x*scale,(p.z-zmin)*scale-.145,-p.y*scale))
bm=bmesh.new();bm.from_mesh(obj.data)
bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)
bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
print('WELDED REFERENCE',len(bm.verts),len(bm.faces),sum(not e.is_manifold for e in bm.edges))
bm.to_mesh(obj.data);bm.free();obj.name='hand_skin'
for p in obj.data.polygons:p.use_smooth=True
for old in list(bpy.context.scene.objects):
    if old is not obj:bpy.data.objects.remove(old,do_unlink=True)
# The common preview script needs a rig only for its preservation audit.
rig=bpy.data.objects.new('AnimeHandRig',bpy.data.armatures.new('ReferencePlaceholder'))
bpy.context.collection.objects.link(rig)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'reference-normalized.blend'))
import sys
sys.argv.extend(['--','06-reference'])
exec(compile((ROOT/'tools/preview-hand-geometry.py').read_text(encoding='utf8'),str(ROOT/'tools/preview-hand-geometry.py'),'exec'))
