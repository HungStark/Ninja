"""Author the anime hand as a continuous subdivision cage, rig and export it.

Run with Blender 4.5 LTS: blender --background --python tools/blender-hands.py
Coordinates intentionally use game Y-up; export_yup=False preserves this rig's
local +Y finger axes, which the game's twelve procedural poses already animate.
"""
import bpy
import bmesh
import math
import sys
from pathlib import Path
from mathutils import Vector
from mathutils.geometry import interpolate_bezier
from mathutils.bvhtree import BVHTree

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'assets'
OUT.mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.context.preferences.filepaths.save_version = 0

def material(name, rgb):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*rgb, 1)
    m.use_nodes = True
    tree = m.node_tree
    tree.nodes.clear()
    output = tree.nodes.new('ShaderNodeOutputMaterial')
    if name in ('skin','nail'):
        surface=tree.nodes.new('ShaderNodeBsdfPrincipled')
        surface.inputs['Base Color'].default_value=(*rgb,1)
        surface.inputs['Roughness'].default_value=.75
        tree.links.new(surface.outputs[0],output.inputs['Surface'])
        return m
    emission = tree.nodes.new('ShaderNodeEmission')
    emission.inputs['Color'].default_value = (*rgb, 1)
    emission.inputs['Strength'].default_value = 1
    tree.links.new(emission.outputs[0], output.inputs['Surface'])
    return m

# Linear RGB, corresponding to the warm peach/pink and navy reference palette.
mats = {n: material(n, rgb) for n, rgb in {
    'skin': (.95, .61, .43), 'nail': (.68, .35, .34),
    'cloth': (.013, .019, .040), 'glove': (.018, .025, .054),
    'trim': (.74, .49, .22), 'edge': (.008, .012, .026),
    'crease': (.52, .29, .24),
}.items()}

FINGERS = [
    dict(name='index', base=(-.047, .080, 0), length=.183, radius=.0158, angle=0),
    dict(name='middle', base=(-.015, .088, 0), length=.192, radius=.0162, angle=0),
    dict(name='ring', base=(.018, .080, 0), length=.176, radius=.0155, angle=0),
    dict(name='little', base=(.048, .059, 0), length=.138, radius=.0135, angle=0),
    dict(name='thumb', base=(-.064, -.002, 0), length=.124, radius=.017, angle=.35),
]

def mesh(name, vertices, faces, mat):
    data = bpy.data.meshes.new(name)
    data.from_pydata(vertices, [], faces)
    data.update()
    obj = bpy.data.objects.new(name, data)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mats[mat])
    bm = bmesh.new()
    bm.from_mesh(data)
    bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
    bm.to_mesh(data)
    bm.free()
    for p in data.polygons:
        p.use_smooth = True
    return obj

def apply_modifier(obj, modifier):
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.select_all(action='DESELECT')
    obj.select_set(True)
    bpy.ops.object.modifier_apply(modifier=modifier.name)

# One watertight volumetric cage. The palm is a loft of rounded 3D sections with
# distinct dorsal arch, thenar and hypothenar pads; finger tubes join its holes.
v, faces, tags = [], [], []
def vertex(p, tag=None):
    v.append(tuple(p)); tags.append(tag)
    return len(v) - 1

xs = [-.066]
tops = [.070]
for f in FINGERS[:4]:
    x, y, _ = f['base']; r = f['radius']
    xs.extend([x-r*.92, x, x+r*.92])
    tops.extend([y-.006, y+.003, y-.006])
xs.append(.065); tops.append(.045)
nx = len(xs)
zs = [-1, -.70, 0, .70, 1]
ys = [-.145, -.115, -.085, -.060, -.034, 0, .033, .052, None]
ny = len(ys)
thumb_low,thumb_mid,thumb_high = 3,4,5

def grid_point(ix, iy, iz):
    upper = tops[ix]
    y = upper if iy == ny-1 else ys[iy]
    # Cross-sections have volume and rounded sides; front and palmar surfaces
    # curve independently instead of being parallel sheets of constant depth.
    width = .70 + .30 * min(1, max(0, (y+.145)/.17))
    latitude=zs[iz]
    x = xs[ix] * width * (1-.12*abs(latitude)**2)
    transverse=abs(xs[ix]/.066)
    round_section=1-.38*transverse**2
    arch=math.exp(-((y+.018)/.070)**2)
    dorsal=(.021+.008*arch)*round_section
    palmar=(.022+.008*arch)*round_section
    # Ellipsoid-derived muscle volumes, built into the same surface topology.
    thenar=max(0,1-((x+.032)/.037)**2-((y+.020)/.070)**2)**1.5
    hypothenar=max(0,1-((x-.037)/.029)**2-((y+.021)/.075)**2)**1.5
    cup=math.exp(-(x/.022)**2-((y-.006)/.057)**2)
    palmar+=.015*thenar+.008*hypothenar-.004*cup
    radial_root=math.exp(-((x+.060)/.025)**2-((y+.027)/.050)**2)
    dorsal+=.007*radial_root
    palmar+=.011*radial_root
    dorsal+=.0025*math.exp(-((y-.053)/.016)**2)*(1-transverse*.3)
    depth=dorsal if latitude>=0 else palmar
    if y<-.095:
        depth=.0195
        x=xs[ix]*width
    return x, y, latitude*depth

grid = {}
for iy in range(ny):
    for ix in range(nx):
        for iz in range(5):
            if iy in (0,ny-1) or ix in (0,nx-1) or iz in (0,4):
                grid[ix,iy,iz] = vertex(grid_point(ix,iy,iz))

# Front/back palm surfaces.
for iz in (0,4):
    for iy in range(ny-1):
        for ix in range(nx-1):
            faces.append([grid[ix,iy,iz],grid[ix+1,iy,iz],grid[ix+1,iy+1,iz],grid[ix,iy+1,iz]])
# Side surfaces; omit the thumb's rectangular patch.
for ix in (0,nx-1):
    for iy in range(ny-1):
        for iz in range(4):
            if ix==0 and iy in (thumb_low,thumb_mid) and iz in (1,2):
                continue
            faces.append([grid[ix,iy,iz],grid[ix,iy+1,iz],grid[ix,iy+1,iz+1],grid[ix,iy,iz+1]])
# Wrist and top surfaces, keeping eight-vertex holes for the finger tubes.
for iy in (0,ny-1):
    for ix in range(nx-1):
        for iz in range(4):
            in_hole = any(ix in (1+3*f,2+3*f) for f in range(4)) and iz in (1,2)
            if iy==ny-1 and in_hole:
                continue
            faces.append([grid[ix,iy,iz],grid[ix+1,iy,iz],grid[ix+1,iy,iz+1],grid[ix,iy,iz+1]])

def connect(a, b):
    for i in range(len(a)):
        faces.append([a[i],a[(i+1)%len(a)],b[(i+1)%len(b)],b[i]])

def local_point(f, x, y, z):
    c,s = math.cos(f['angle']), math.sin(f['angle'])
    return (f['base'][0]+c*x-s*y, f['base'][1]+s*x+c*y, z)

def surface_point(f,x,t,z):
    if f['name']!='thumb':
        return local_point(f,x,t*f['length'],z)
    # CMC/thenar volume exits the radial palm sideways before the phalanges
    # turn upwards. Rings are perpendicular to that actual 3D centerline;
    # offsetting a straight finger tube makes an overhang and a pinched root.
    s=max(0,min(1,t/1.035));q=1-s
    p0=Vector((-.064,-.030,0));p1=Vector((-.099,-.030,0))
    p2=Vector((-.125,.055,0));p3=Vector(local_point(f,0,f['length']*1.035,0))
    center=q*q*q*p0+3*q*q*s*p1+3*q*s*s*p2+s*s*s*p3
    tangent=(3*q*q*(p1-p0)+6*q*s*(p2-p1)+3*s*s*(p3-p2)).normalized()
    across=Vector((tangent.y,-tangent.x,0))
    return tuple(center+across*x+Vector((0,0,z)))

def finger_weights(f, t):
    name = f['name']
    if t < .34: return {name+'_0': 1}
    if t < .57:
        w = (t-.34)/.23
        return {name+'_0': 1-w, name+'_1': w}
    if t < .66: return {name+'_1': 1}
    if t < .86:
        w = (t-.66)/.20
        return {name+'_1': 1-w, name+'_2': w}
    return {name+'_2': 1}

for fi,f in enumerate(FINGERS):
    if fi < 4:
        left = 1 + 3*fi; center = left+1; right=left+2; iy=ny-1
        loop = [grid[right,iy,2],grid[right,iy,3],grid[center,iy,3],grid[left,iy,3],
                grid[left,iy,2],grid[left,iy,1],grid[center,iy,1],grid[right,iy,1]]
    else:
        loop = [grid[0,thumb_high,2],grid[0,thumb_high,3],grid[0,thumb_mid,3],grid[0,thumb_low,3],
                grid[0,thumb_low,2],grid[0,thumb_low,1],grid[0,thumb_mid,1],grid[0,thumb_high,1]]
    for i in loop:
        tags[i] = {f['name']+'_0': .18, 'wrist': .82}
    for t in [.085,.18,.30,.38,.46,.54,.64,.70,.77,.84,.92,.975,1.015]:
        cap = 1 if t < .92 else math.sqrt(max(.08,1-((t-.92)/.105)**2))
        pip=math.exp(-((t-.46)/.095)**2)
        dip=math.exp(-((t-.77)/.075)**2)
        radius = f['radius'] * (1.12-.26*t+.10*pip+.06*dip) * cap
        if fi==4:
            radius*=1+.32*math.exp(-(t/.35)**2)
        # Full rounded 3D phalanges, tapering at the tips. The relaxed centerline
        # curves slightly towards the palm, with real knuckle and finger-pad mass.
        ring = []
        for j in range(8):
            a = j*math.tau/8
            x = radius*math.cos(a)
            z = radius*.96*math.sin(a)-.008*t*t+.0015*math.sin(math.pi*t)
            z+=.0016*(pip+.65*dip)*max(0,math.sin(a))**2
            z-=.0012*math.exp(-((t-.30)/.13)**2)*max(0,-math.sin(a))**2
            ring.append(vertex(surface_point(f,x,t,z),finger_weights(f,t)))
        connect(loop,ring);loop=ring
    tip = vertex(surface_point(f,0,1.035,-.0085),{f['name']+'_2':1})
    for j in range(8): faces.append([loop[j],loop[(j+1)%8],tip])

skin = mesh('hand_skin',v,faces,'skin')
bone_names = ['wrist']+[f['name']+'_'+str(j) for f in FINGERS for j in range(3)]
for name in bone_names: skin.vertex_groups.new(name=name)
for i, tag in enumerate(tags):
    for name, weight in (tag or {'wrist':1}).items():
        skin.vertex_groups[name].add([i],weight,'REPLACE')
# Remove unused vertices at the centres of attachment holes.
bm=bmesh.new();bm.from_mesh(skin.data)
bmesh.ops.delete(bm,geom=[p for p in bm.verts if not p.link_faces],context='VERTS')
bm.to_mesh(skin.data);bm.free()
sub=skin.modifiers.new('Rounded anime topology','SUBSURF');sub.levels=2
apply_modifier(skin,sub)

# Use the user's supplied 3D anatomy as the current authoring basis. The older
# procedural loft is available explicitly for comparison; missing source files
# must not silently change the anatomy on a later asset rebuild.
reference=ROOT/'anime_style_hand.glb'
using_reference='--procedural' not in sys.argv
if using_reference and not reference.exists():
    raise FileNotFoundError('Keep anime_style_hand.glb in the project root to rebuild the reference hand, or explicitly use --procedural for the older loft.')
if using_reference:
    import importlib.util
    spec=importlib.util.spec_from_file_location('reference_hand',ROOT/'tools/reference-hand.py')
    adapter=importlib.util.module_from_spec(spec);spec.loader.exec_module(adapter)
    bpy.data.objects.remove(skin,do_unlink=True)
    skin,FINGERS=adapter.reconstruct_reference(reference,mats['skin'],finger_weights)

def rig_point(f,x,y,z):
    px,py,pz=local_point(f,x,y,z)
    return px,py,pz+f['base'][2]

# Rig local Y points from each joint to the next, with no axis conversion.
arm_data=bpy.data.armatures.new('AnimeHandRig')
rig=bpy.data.objects.new('AnimeHandRig',arm_data)
bpy.context.collection.objects.link(rig)
bpy.context.view_layer.objects.active=rig
bpy.ops.object.mode_set(mode='EDIT')
wrist=arm_data.edit_bones.new('wrist');wrist.head=(0,0,0);wrist.tail=(0,.04,0)
for f in FINGERS:
    previous=wrist
    for j,(start,end) in enumerate([(0,.46),(.46,.77),(.77,1.035)]):
        b=arm_data.edit_bones.new(f['name']+'_'+str(j))
        b.head=rig_point(f,0,start*f['length'],0)
        b.tail=rig_point(f,0,end*f['length'],0)
        b.parent=previous;b.use_connect=j>0;previous=b
bpy.ops.object.mode_set(mode='OBJECT')
mod=skin.modifiers.new('Hand skinning','ARMATURE');mod.object=rig
skin.parent=rig

def skin_to(obj, name):
    group=obj.vertex_groups.new(name=name)
    group.add(list(range(len(obj.data.vertices))),1,'REPLACE')
    mod=obj.modifiers.new('Rigid bone attachment','ARMATURE');mod.object=rig
    obj.parent=rig

depsgraph=bpy.context.evaluated_depsgraph_get()
bvh=BVHTree.FromObject(skin,depsgraph)

if using_reference:
    # Nails/crease marks follow the reference's phalanges, rather than the old
    # offset thumb Bézier. Their final Z is projected onto the actual new mesh.
    def surface_point(f,x,t,z):return rig_point(f,x,t*f['length'],z)
def dorsal_surface(point, offset=.00035):
    p=Vector(point)
    hit,normal,_,_=bvh.ray_cast(Vector((p.x,p.y,1)),Vector((0,0,-1)))
    if hit is not None:return tuple(hit+(Vector((0,0,offset)) if using_reference else normal*offset))
    if using_reference:raise RuntimeError(f'Detail outside reference skin: {tuple(p)}')
    return tuple(p)

# Nails are shallow rounded plates conforming to the distal finger, rather than
# white raised rims. They are separate rigged surfaces so each gets a thin ink edge.
for f in FINGERS:
    verts=[];polys=[]
    length=f['length']*.135;center=f['length']*.890;width=f['radius']*.50
    if using_reference and f['name']=='thumb':
        length=f['length']*.12;center=f['length']*.84;width=f['radius']*.42
    # Dense concentric loops follow the actual subdivided finger surface. A
    # single triangle fan cuts through the curved finger and clips the pink fill.
    for k in range(1,6):
        for j in range(32):
            a=j*math.tau/32;ca,sa=math.cos(a),math.sin(a)
            x=width*math.copysign(abs(ca)**.65,ca)*k/5
            y=center+length*.5*math.copysign(abs(sa)**.60,sa)*k/5
            verts.append(dorsal_surface(surface_point(f,x,y/f['length'],0),.00025))
    front_center=len(verts);verts.append(dorsal_surface(surface_point(f,0,center/f['length'],0),.00025))
    for j in range(32):polys.append([front_center,j,(j+1)%32])
    for k in range(4):
        for j in range(32):polys.append([k*32+j,k*32+(j+1)%32,(k+1)*32+(j+1)%32,(k+1)*32+j])
    back_start=len(verts)
    verts.extend([(x,y,z-.00012) for x,y,z in verts[128:160]])
    back_center=len(verts);verts.append((verts[front_center][0],verts[front_center][1],verts[front_center][2]-.00012))
    for j in range(32):
        polys.append([back_center,back_start+(j+1)%32,back_start+j])
        polys.append([128+j,back_start+j,back_start+(j+1)%32,128+(j+1)%32])
    nail=mesh(f['name']+'_nail',verts,polys,'nail')
    skin_to(nail,f['name']+'_2')

# Restrained drawn knuckle marks, attached to the same interpolated bone weights
# as the skin. Only short dorsal marks; no noisy skin texture or lighting shadows.
for f in FINGERS:
    for t in (.46,.77):
        verts=[];polys=[]
        for j in range(9):
            u=j/8-.5;x=u*f['radius']*1.05
            y=f['length']*t+.0011*(1-(u*2)**2)
            for dy in (-.00016,.00016):
                verts.append(dorsal_surface(surface_point(f,x,(y+dy)/f['length'],0),.00014))
        for j in range(8):polys.append([j*2,j*2+1,j*2+3,j*2+2])
        obj=mesh(f['name']+'_crease_'+str(t),verts,polys,'crease')
        for name,weight in finger_weights(f,t).items():
            g=obj.vertex_groups.new(name=name);g.add(list(range(len(verts))),weight,'REPLACE')
        mod=obj.modifiers.new('Crease skinning','ARMATURE');mod.object=rig;obj.parent=rig

def lathe(name,profile,mat,depth=.90,n=48):
    verts=[];polys=[]
    for y,r in profile:
        for j in range(n):
            a=j*math.tau/n;verts.append((r*math.cos(a),y,r*math.sin(a)*depth))
    for k in range(len(profile)-1):
        for j in range(n):polys.append([k*n+j,k*n+(j+1)%n,(k+1)*n+(j+1)%n,(k+1)*n+j])
    polys.append(list(reversed(range(n))));polys.append(list(range((len(profile)-1)*n,len(profile)*n)))
    o=mesh(name,verts,polys,mat);skin_to(o,'wrist');return o

lathe('sleeve',[(-.52,.081),(-.42,.078),(-.30,.073),(-.20,.063),(-.145,.053)],'cloth')
lathe('wrist_cuff',[(-.182,.061),(-.173,.063),(-.115,.054),(-.109,.052)],'glove')
lathe('gold_binding',[(-.187,.061),(-.184,.064),(-.176,.064),(-.173,.061)],'trim')

# Rounded shield silhouette and circular gold emblem from the supplied reference.
curves=[[(0,.075),(.043,.075),(.069,.035),(.067,-.006)],
        [(.067,-.006),(.065,-.045),(.041,-.080),(.018,-.085)],
        [(.018,-.085),(.006,-.091),(-.006,-.091),(-.018,-.085)],
        [(-.018,-.085),(-.041,-.080),(-.065,-.045),(-.067,-.006)],
        [(-.067,-.006),(-.069,.035),(-.043,.075),(0,.075)]]
shield=[]
for c in curves:
    pts=interpolate_bezier(*[Vector((x,y,0)) for x,y in c],18)
    shield.extend([(p.x,p.y) for p in pts[:-1]])
def plate(name,shape,mat,z,y,scale=1):
    verts=[];polys=[];n=len(shape)
    for level in (0,1):
        for x,py in shape:
            verts.append((x*scale,py*scale+y,z+level*.003+.010*(1-(x/.075)**2)))
    for j in range(n):polys.append([j,(j+1)%n,n+(j+1)%n,n+j])
    polys.append(list(reversed(range(n))));polys.append(list(range(n,2*n)))
    o=mesh(name,verts,polys,mat);skin_to(o,'wrist');return o
plate('guard_outline',shield,'edge',.031,-.047,1.025)
plate('glove_back',shield,'glove',.035,-.047)
circle=[(math.cos(j*math.tau/64)*.038,math.sin(j*math.tau/64)*.038) for j in range(64)]
plate('wrist_plate',circle,'edge',.050,-.028)

def ring(name,radius,tube,center,mat):
    verts=[];polys=[];n=64;m=8
    for j in range(n):
        a=j*math.tau/n
        for k in range(m):
            b=k*math.tau/m;r=radius+tube*math.cos(b)
            verts.append((center[0]+r*math.cos(a),center[1]+r*math.sin(a),center[2]+tube*math.sin(b)))
    for j in range(n):
        for k in range(m):polys.append([j*m+k,((j+1)%n)*m+k,((j+1)%n)*m+(k+1)%m,j*m+(k+1)%m])
    o=mesh(name,verts,polys,mat);skin_to(o,'wrist');return o
# Broad flat gold annulus, rather than a thick round torus.
verts=[];polys=[]
for r in (.039,.028):
    for j in range(64):
        a=j*math.tau/64;verts.append((r*math.cos(a),-.028+r*math.sin(a),.067))
for j in range(64):polys.append([j,(j+1)%64,64+(j+1)%64,64+j])
o=mesh('gold_emblem',verts,polys,'trim');skin_to(o,'wrist')
ring('chakra_rune',.012,.00165,(0,-.028,.068),'trim')
o=mesh('chakra_line',[(-.0034,-.009,.070),(-.0010,-.008,.070),(.004,-.048,.070),(.0015,-.049,.070)],[[0,1,2,3]],'trim');skin_to(o,'wrist')
for side in (-1,1):
    # Two flat gold seams taper down the forearm, as in the reference.
    verts=[]
    for y,x,z in [(-.20,.041,.042),(-.31,.049,.050),(-.50,.057,.052)]:
        verts.extend([(side*x-.0016,y,z),(side*x+.0016,y,z)])
    o=mesh('sleeve_seam',verts,[[0,1,3,2],[2,3,5,4]],'trim');skin_to(o,'wrist')

rig['authoring']='Blender Python, reference anatomy adaptation' if using_reference else 'Blender Python, volumetric loft subdivision level 2'
rig['reference']='anime_style_hand.glb supplied by user' if using_reference else 'User supplied anime hand image'
if not using_reference:skin['topology']='Continuous 3D loft: dorsal arch, thenar/hypothenar muscle volumes, tapered curved phalanges'
bm=bmesh.new();bm.from_mesh(skin.data)
bad=sum(not e.is_manifold for e in bm.edges)
bm.free()
if bad:raise RuntimeError(f'Hand must be closed and manifold: {bad} invalid edges')
bpy.context.scene.view_settings.view_transform='Standard'
bpy.ops.object.select_all(action='DESELECT')
skin.select_set(True);bpy.context.view_layer.objects.active=skin
for screen in bpy.data.screens:
    for area in screen.areas:
        if area.type=='VIEW_3D':
            area.spaces.active.shading.color_type='MATERIAL'
            area.spaces.active.shading.show_shadows=False
            area.spaces.active.region_3d.view_distance=.65
            area.spaces.active.region_3d.view_location=Vector((0,-.1,0))
            area.spaces.active.region_3d.view_rotation=(1,0,0,0)
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'anime-hands.blend'))
bpy.ops.export_scene.gltf(filepath=str(OUT/'blender-hands.glb'),export_format='GLB',
    export_yup=False,export_animations=False,export_skins=True,export_materials='EXPORT',
    export_all_influences=False,export_apply=False,export_extras=True)
print(f'BLENDER HAND OK: {len(skin.data.vertices)} skin vertices, 16 bones, closed manifold cage')
