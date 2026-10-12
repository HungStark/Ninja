"""Clay inspection independent of the game shader: front, 45 degrees, side.

blender -b assets/anime-hands.blend --python tools/preview-hand-geometry.py -- stage-name
Saves three fixed orthographic renders and a geometry audit under test-results.
"""
import bpy
import bmesh
import json
import math
import sys
import hashlib
from pathlib import Path
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent.parent
stage = sys.argv[sys.argv.index('--')+1] if '--' in sys.argv else 'clay'
out = ROOT / 'test-results' / 'hand-volume' / stage
out.mkdir(parents=True, exist_ok=True)
skin = bpy.data.objects['hand_skin']
data = skin.data
bm = bmesh.new(); bm.from_mesh(data)
audit = {
    'stage': stage, 'vertices': len(data.vertices), 'faces': len(data.polygons),
    'non_manifold_edges': sum(not e.is_manifold for e in bm.edges),
    'volume_m3': abs(bm.calc_volume(signed=True)),
    'bounds_m': {axis: [min(p.co[i] for p in data.vertices),max(p.co[i] for p in data.vertices)] for i,axis in enumerate('xyz')},
}
bm.free()
audit['preserved_geometry_hashes']={}
for obj in bpy.context.scene.objects:
    if obj.type=='MESH' and not (obj.name=='hand_skin' or obj.name.endswith('_nail') or '_crease_' in obj.name):
        record=([tuple(v.co) for v in obj.data.vertices],[tuple(p.vertices) for p in obj.data.polygons])
        audit['preserved_geometry_hashes'][obj.name]=hashlib.sha256(repr(record).encode()).hexdigest()
audit['rig_rest_hash']=hashlib.sha256(repr([(b.name,tuple(b.head_local),tuple(b.tail_local),tuple(tuple(row) for row in b.matrix_local)) for b in bpy.data.objects['AnimeHandRig'].data.bones]).encode()).hexdigest()
bvh=BVHTree.FromObject(skin,bpy.context.evaluated_depsgraph_get())
audit['palm_sections_m'] = []
for label,x,y in [('center',0,-.015),('thenar',-.035,-.015),('little_side',.036,-.015),('knuckles',0,.053),('wrist',0,-.095)]:
    front,_,_,_=bvh.ray_cast(Vector((x,y,1)),Vector((0,0,-1)))
    back,_,_,_=bvh.ray_cast(Vector((x,y,-1)),Vector((0,0,1)))
    audit['palm_sections_m'].append({'label':label,'front':front.z if front else None,'back':back.z if back else None,'thickness':front.z-back.z if front and back else None})
audit['nails']={}
for obj in bpy.context.scene.objects:
    if obj.name.endswith('_nail'):
        gaps=[bvh.find_nearest(p.co)[3] for p in obj.data.vertices]
        audit['nails'][obj.name]={'area_m2':sum(p.area for p in obj.data.polygons),'max_distance_to_skin_m':max(gaps)}
flat = [p for p in data.polygons if -.07<p.center.y<.04 and abs(p.center.x)<.05 and p.center.z>.005]
audit['dorsal_palm_mean_abs_normal_z'] = sum(abs(p.normal.z)*p.area for p in flat)/sum(p.area for p in flat)
audit['dorsal_palm_area_with_nearly_axial_normals'] = sum(p.area for p in flat if abs(p.normal.z)>.995)/sum(p.area for p in flat)
(out/'audit.json').write_text(json.dumps(audit,indent=2),encoding='utf8')
print('CLAY AUDIT',json.dumps(audit))

clay=bpy.data.materials.new('NeutralGrayInspection')
clay.diffuse_color=(.36,.36,.36,1);clay.use_nodes=True
bsdf=clay.node_tree.nodes.get('Principled BSDF')
bsdf.inputs['Base Color'].default_value=(.36,.36,.36,1)
bsdf.inputs['Roughness'].default_value=.72
bsdf.inputs['Metallic'].default_value=0
for obj in bpy.context.scene.objects:
    if obj.type=='MESH':
        obj.hide_render = not (obj.name=='hand_skin' or obj.name.endswith('_nail'))
        if not obj.hide_render:
            obj.data.materials.clear();obj.data.materials.append(clay)
    elif obj.type in ('LIGHT','CAMERA'):
        obj.hide_render=True
scene=bpy.context.scene
scene.render.engine='CYCLES'
scene.cycles.device='CPU'
scene.cycles.samples=32
scene.cycles.use_denoising=True
scene.render.resolution_x=850;scene.render.resolution_y=1050;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.render.film_transparent=False
scene.view_settings.view_transform='AgX'
scene.world=bpy.data.worlds.new('NeutralStudio')
scene.world.use_nodes=True
scene.world.node_tree.nodes['Background'].inputs[0].default_value=(.035,.035,.035,1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value=.5
target=Vector((-.01,.070,0))
def aim(obj,position):
    obj.location=Vector(position)
    back=(obj.location-target).normalized()
    right=Vector((0,1,0)).cross(back).normalized()
    up=back.cross(right).normalized()
    obj.rotation_euler=Matrix((right,up,back)).transposed().to_quaternion().to_euler()
def light(name,position,power,size):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.shape='DISK';d.size=size
    o=bpy.data.objects.new(name,d);scene.collection.objects.link(o);aim(o,position)
light('ClayKey',(-.45,.55,.65),10,.40)
light('ClayFill',(.45,.10,.45),3,.50)
light('ClayRim',(-.20,.35,-.40),5,.35)
c=bpy.data.cameras.new('InspectionCamera');c.type='ORTHO';c.ortho_scale=.47
cam=bpy.data.objects.new('InspectionCamera',c);scene.collection.objects.link(cam);scene.camera=cam
for name,degrees in [('front',0),('angle-45',45),('side',90)]:
    a=math.radians(degrees)
    aim(cam,target+Vector((-math.sin(a),0,math.cos(a))))
    scene.render.filepath=str(out/(name+'.png'))
    bpy.ops.render.render(write_still=True)
print('CLAY PREVIEWS',out)
