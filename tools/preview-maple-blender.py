"""Create a posed, editable Blender workshop from the final runtime asset."""
import bpy
import contextlib
import io
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion

ROOT=Path(__file__).resolve().parent.parent
scene=bpy.context.scene if bpy.app.background else (
    bpy.data.scenes.get('Maple Ninja Workshop') or bpy.data.scenes.new('Maple Ninja Workshop'))
scene.name='Maple Ninja Workshop'
bpy.context.window.scene=scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj,do_unlink=True)
with contextlib.redirect_stdout(io.StringIO()):
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
scene.world=bpy.data.worlds.new('Maple studio world')
scene.world.use_nodes=True
bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND')
bg.inputs[0].default_value=(.10,.12,.16,1)
bg.inputs[1].default_value=.41
for name,pos,color,energy,size in [
    ('Warm key',(2.8,-3.7,4.2),(1,.84,.70),640,3.4),
    ('Cool fill',(-2.8,-2.0,2.35),(.66,.77,1),340,3.6),
    ('Amber rim',(-1.0,2.6,3.8),(1,.61,.38),700,2.1),
    ('Soft rear fill',(3.0,2.8,2.95),(.69,.79,1),330,2.7),
]:
    data=bpy.data.lights.new(name,'AREA');data.energy=energy;data.shape='DISK';data.size=size
    data.color=color
    obj=bpy.data.objects.new(name,data);scene.collection.objects.link(obj);obj.location=pos
    obj.rotation_euler=(Vector((0,0,1))-obj.location).to_track_quat('-Z','Y').to_euler()

bpy.ops.mesh.primitive_plane_add(size=200,location=(0,0,-.006))
floor=bpy.context.object
floor.name='Studio ground'
material=bpy.data.materials.new('Warm slate')
material.use_nodes=True
shader=next(n for n in material.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
shader.inputs['Base Color'].default_value=(.033,.030,.032,1)
shader.inputs['Roughness'].default_value=.6
floor.data.materials.append(material)


def camera(name,pos,look,size):
    data=bpy.data.cameras.new(name)
    obj=bpy.data.objects.new(name,data)
    scene.collection.objects.link(obj)
    obj.location=pos
    obj.rotation_euler=(Vector(look)-obj.location).to_track_quat('-Z','Y').to_euler()
    data.type='ORTHO'
    data.ortho_scale=size
    return obj


front=camera('Front three-quarter',(2.1,-5.8,2.05),(0,0,.97),2.17)
back=camera('Back three-quarter',(-2.5,5.4,2.10),(.035,.13,.97),2.17)
camera('Face and shoulder',(1.15,-4,1.97),(.02,0,1.60),.66)
scene.camera=front
scene.render.resolution_x=840
scene.render.resolution_y=1040
scene.render.resolution_percentage=100
scene.render.image_settings.file_format='PNG'
scene.view_settings.view_transform='AgX'
scene['runtime_source']='assets/hero-ninja-reference.glb'
scene['build_source']='tools/build-hero-reference.py + tools/hero-maple-outfit.py + tools/hero-maple-textures.py'
scene['preserved']='113 bones; original inverse bind matrices; eyelid morphs; finger rig'
for area in bpy.context.screen.areas if bpy.context.screen else ():
    if area.type=='VIEW_3D':
        area.spaces.active.region_3d.view_perspective='CAMERA'
        area.spaces.active.overlay.show_overlays=False
floor.select_set(False)
bpy.context.view_layer.objects.active=rig
for material in {m for o in scene.objects if o.type=='MESH' for m in o.data.materials if m and m.use_nodes}:
    for node in material.node_tree.nodes:
        if node.type=='TEX_IMAGE' and node.image and not node.image.packed_file:
            node.image.pack()
scene.render.filepath=str(ROOT/'assets/hero-maple-preview.png')
if bpy.app.background:
    bpy.context.preferences.filepaths.save_version=0
    bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'assets/hero-maple.blend'),compress=True)
    print('Saved Maple Ninja Workshop with packed textures.')

if globals().get('RENDER_PREVIEWS', True):
    bpy.ops.render.render(write_still=True)
    scene.camera=back
    scene.render.filepath=str(ROOT/'assets/hero-maple-back.png')
    bpy.ops.render.render(write_still=True)
    scene.camera=front
    scene.render.filepath=str(ROOT/'assets/hero-maple-preview.png')
