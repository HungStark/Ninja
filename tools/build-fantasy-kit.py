"""Deterministic Blender source for the game's lightweight fantasy scenery.

Run inside Blender. Exports indexed-neutral, Y-up geometry embedded by esbuild,
so file://, Android and web builds all use exactly the same assets.
Only the dedicated Fantasy Asset Workshop scene is edited.
"""
import bpy
import bmesh
import math
import random
import json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
SCENE = 'Fantasy Asset Workshop'
scene = bpy.data.scenes.get(SCENE) or bpy.data.scenes.new(SCENE)
if bpy.context.window:
    bpy.context.window.scene = scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj, do_unlink=True)
rng = random.Random(8719)
assets = {}

def model(name, vertices, faces, tint):
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(vertices, [], faces)
    mesh.update()
    obj = bpy.data.objects.new(name, mesh)
    scene.collection.objects.link(obj)
    colors = mesh.color_attributes.new(name='Surface variation', type='FLOAT_COLOR', domain='CORNER')
    for poly in mesh.polygons:
        shade = .80 + rng.random() * .25
        for li in poly.loop_indices:
            z = mesh.vertices[mesh.loops[li].vertex_index].co.z
            value = shade * (.88 + max(0, min(1, (z + 1) / 2)) * .12)
            colors.data[li].color = (value, value, value, 1)
    mat = bpy.data.materials.new(name + ' preview')
    mat.use_nodes = True
    bsdf = next(n for n in mat.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
    bsdf.inputs['Base Color'].default_value = (*tint, 1)
    bsdf.inputs['Roughness'].default_value = .86
    obj.data.materials.append(mat)
    mesh.calc_loop_triangles()
    p, n, c, uv = [], [], [], []
    for tri in mesh.loop_triangles:
        if tri.area < 1e-9:
            continue
        for li in tri.loops:
            v = mesh.vertices[mesh.loops[li].vertex_index].co
            normal = tri.normal
            p.extend(round(x, 5) for x in (v.x, v.z, -v.y))
            n.extend(round(x, 5) for x in (normal.x, normal.z, -normal.y))
            c.extend(round(x, 4) for x in colors.data[li].color[:3])
            uv.extend((round(v.x * .6 + v.y * .4, 5), round(v.z, 5)))
    assets[name] = {'position': p, 'normal': n, 'color': c, 'uv': uv}
    return obj

def tube(v, f, points, radii, sides=7):
    start = len(v)
    for k, point in enumerate(points):
        p = Vector(point)
        tangent = Vector(points[min(k + 1, len(points) - 1)]) - Vector(points[max(0, k - 1)])
        q = Vector((0, 0, 1)).rotation_difference(tangent.normalized())
        for j in range(sides):
            a = j * math.tau / sides
            off = q @ Vector((math.cos(a) * radii[k], math.sin(a) * radii[k], 0))
            v.append(tuple(p + off))
        if k:
            for j in range(sides):
                a = start + (k - 1) * sides + j
                b = start + (k - 1) * sides + (j + 1) % sides
                f.append((a, b, b + sides, a + sides))
    f.append(tuple(start + j for j in reversed(range(sides))))
    f.append(tuple(start + (len(points) - 1) * sides + j for j in range(sides)))

v, f = [], []
tube(v, f, [(0, 0, -.5), (.015, .01, -.25), (-.025, -.02, .05), (.03, 0, .4), (0, .025, .74)], [.24, .18, .135, .10, .035], 9)
for k in range(5):
    a = k * 2.4
    x, y = math.sin(a), math.cos(a)
    tube(v, f, [(x * .43, y * .43, -.49), (x * .18, y * .18, -.35), (0, 0, -.14)], [.025, .09, .13], 5)
    tube(v, f, [(0, 0, .02 + k * .08), (x * .28, y * .28, .37 + k * .05), (x * .46, y * .46, .55 + k * .04)], [.075, .045, .01], 5)
model('branching-trunk', v, f, (.22, .12, .065))

# Scalloped foliage volumes plus folded leaf silhouettes, no alpha overdraw.
v, f = [], []
for k in range(8):
    a = k * 2.4
    radius = 0 if k == 0 else .47 + (k % 3) * .055
    center = Vector((math.sin(a) * radius, math.cos(a) * radius, .43 if k == 0 else .08 + (k % 3) * .16))
    bm = bmesh.new()
    bmesh.ops.create_icosphere(bm, subdivisions=2, radius=1)
    bm.verts.ensure_lookup_table()
    bm.verts.index_update()
    start = len(v)
    for vert in bm.verts:
        p = vert.co
        wobble = 1 + .06 * math.sin(p.x * 7 + p.y * 4 + k)
        v.append(tuple(center + Vector((p.x * .51 * wobble, p.y * .49 * wobble, p.z * .51 * wobble))))
    for face in bm.faces:
        f.append(tuple(start + vert.index for vert in face.verts))
    bm.free()
for k in range(80):
    a = rng.random() * math.tau
    z = rng.uniform(-.4, .88)
    r = math.sqrt(max(.06, 1 - (z - .18) ** 2)) * rng.uniform(.71, 1)
    p = Vector((math.sin(a) * r, math.cos(a) * r, z))
    side = Vector((math.cos(a), -math.sin(a), .02)) * rng.uniform(.06, .095)
    along = Vector((math.sin(a) * .13, math.cos(a) * .13, .025))
    s = len(v)
    v.extend([tuple(p - along), tuple(p + side), tuple(p + along), tuple(p - side), tuple(p + Vector((0, 0, .035)))])
    f.extend([(s, s + 1, s + 4), (s + 1, s + 2, s + 4), (s + 2, s + 3, s + 4), (s + 3, s, s + 4)])
model('layered-crown', v, f, (.21, .36, .075))

v, f = [], []
for tier in range(5):
    z = -.85 + tier * .36
    r = 1 - tier * .17
    tube(v, f, [(0, 0, z), (.04, 0, z + .13), (0, 0, z + .75)], [r * .83, r, .015], 9)
model('conifer-crown', v, f, (.09, .20, .16))

# Broad compound leaves fill the understory without transparent leaf cards.
v, f = [], []
for frond in range(7):
    angle = frond * 2.39996
    forward = Vector((math.sin(angle), math.cos(angle), 0))
    side = Vector((math.cos(angle), -math.sin(angle), 0))
    length = .75 + (frond % 3) * .12
    points = []
    for k in range(6):
        t = k / 5
        center = forward * (t * length)
        center.z = math.sin(t * math.pi * .72) * (.63 + frond % 2 * .14)
        points.append(tuple(center))
        if k == 0:
            continue
        for hand in [-1, 1]:
            reach = (.08 + math.sin(t * math.pi) * .23)
            tip = center + side * hand * reach + forward * .12
            mid = center.lerp(tip, .5)
            s = len(v)
            v.extend([tuple(center), tuple(mid + forward * .065), tuple(tip), tuple(mid - forward * .05), tuple(mid + Vector((0, 0, .035)))])
            f.extend([(s, s + 1, s + 4), (s + 1, s + 2, s + 4), (s + 2, s + 3, s + 4), (s + 3, s, s + 4)])
    tube(v, f, points, [.015, .013, .011, .009, .006, .002], 4)
model('forest-fern', v, f, (.18, .32, .10)).location = (-1, -2, 0)

# Eroded stone: broad planes, chipped shoulders, planted underside.
for variant in range(3):
    v, f = [], []
    sides = 9
    for row, (z, radius) in enumerate([(-.72, .7), (-.34, 1), (.37, .88), (.77, .54)]):
        for j in range(sides):
            a = j * math.tau / sides
            r = radius * (.88 + rng.random() * .23)
            v.append((math.cos(a) * r, math.sin(a) * r, z + (rng.random() - .5) * .16))
            if row:
                b = row * sides + j
                p = row * sides + (j + 1) % sides
                f.append((b - sides, p - sides, p, b))
    f.append(tuple(reversed(range(sides))))
    f.append(tuple(3 * sides + j for j in range(sides)))
    obj = model('weathered-rock-' + str(variant), v, f, (.31, .34, .30))
    obj.location.x = 3 + variant * 2.4

(ROOT / 'assets' / 'fantasy-kit.json').write_text(json.dumps(assets, separators=(',', ':')), encoding='utf-8')
scene['runtime_asset'] = 'assets/fantasy-kit.json; positions Y-up; grayscale vertex colors preserve village palette'
for name, pos in [('branching-trunk', (-3, 0, .7)), ('layered-crown', (-3, 0, 2.2)), ('conifer-crown', (0, 0, 1.6))]:
    scene.objects[name].location = pos
scene.world = bpy.data.worlds.new('Workshop daylight')
scene.world.use_nodes = True
bg = next(n for n in scene.world.node_tree.nodes if n.type == 'BACKGROUND')
bg.inputs[0].default_value = (.35, .43, .54, 1)
bg.inputs[1].default_value = .7
light_data = bpy.data.lights.new('Workshop sun', 'SUN')
light_data.energy = 2.5
light = bpy.data.objects.new('Workshop sun', light_data)
scene.collection.objects.link(light)
light.rotation_euler = (.4, -.6, -.5)
camera_data = bpy.data.cameras.new('Workshop camera')
camera = bpy.data.objects.new('Workshop camera', camera_data)
scene.collection.objects.link(camera)
camera.location = (12, -16, 11)
camera.rotation_euler = (Vector((2, 0, 1)) - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera_data.type = 'ORTHO'
camera_data.ortho_scale = 14
scene.camera = camera
scene.render.resolution_x = 1200
scene.render.resolution_y = 700
scene.render.resolution_percentage = 100
bpy.ops.wm.save_as_mainfile(filepath=str(ROOT / 'assets' / 'fantasy-scenery.blend'))
print(json.dumps({name: len(data['position']) // 9 for name, data in assets.items()}))
