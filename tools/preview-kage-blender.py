"""Create a posed, editable Blender workshop from the final runtime asset."""
import bpy
import math
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion

ROOT=Path(__file__).resolve().parent.parent
scene=bpy.data.scenes.get('Kage Character Workshop') or bpy.data.scenes.new('Kage Character Workshop')
bpy.context.window.scene=scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(ROOT/'assets/hero-ninja-reference.glb'))
rig=next(obj for obj in scene.objects if obj.type=='ARMATURE')
# Match the runtime garment dyes in this editable workshop as well.
for obj in scene.objects:
    if obj.type!='MESH':
        continue
    for material in obj.data.materials:
        if not material or not material.use_nodes:
            continue
        name=material.name.lower()
        color='#211e25' if 'tops' in name else '#1b181e' if 'bottoms' in name else '#181a20' if 'shoes' in name else None
        if not color:
            continue
        shader=next((n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
        if shader:
            rgb=[int(color[i:i+2],16)/255 for i in (1,3,5)]
            rgb=[c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb]
            shader.inputs['Base Color'].default_value=(*rgb,1)
            shader.inputs['Roughness'].default_value=.9
for side,angle in [('L',1.47),('R',-1.47)]:
    bone=rig.pose.bones['J_Bip_'+side+'_UpperArm']
    rest=rig.matrix_world@bone.bone.matrix_local
    p=rest.translation
    rotation=Quaternion(Vector((0,1,0)),angle).to_matrix().to_4x4()
    bone.matrix=rig.matrix_world.inverted()@Matrix.Translation(p)@rotation@Matrix.Translation(-p)@rest
bpy.context.view_layer.update()
scene.world=bpy.data.worlds.new('Kage studio world')
scene.world.use_nodes=True
bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs[0].default_value=(.13,.15,.19,1)
bg.inputs[1].default_value=.55
for name,pos,energy,size in [('Kage key',(-3,-4,5),700,4),('Kage rim',(3,2,4),900,3)]:
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=pos
    obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Kage review camera')
camera=bpy.data.objects.new('Kage review camera',data);scene.collection.objects.link(camera)
camera.location=(3,-5,2.5);camera.rotation_euler=(Vector((0,0,.96))-camera.location).to_track_quat('-Z','Y').to_euler()
data.type='ORTHO';data.ortho_scale=2.35;scene.camera=camera
scene.render.resolution_x=900;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
scene['runtime_source']='assets/hero-ninja-reference.glb'
scene['build_source']='tools/build-hero-reference.py + tools/hero-kage-outfit.py'
scene['preserved']='113 bones; original inverse bind matrices; eyelid morphs; finger rig'
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/hero-kage.blend'))
print('Saved editable Kage character with native rig and shape keys.')
