"""Build blockier character variants without re-exporting their rigs or faces.

Run: blender --background --python tools/character-blocks.py
Original GLB/VRM files remain the source of truth. Only hair and clothing
primitives change; skeletons, bind matrices, face morph values and VRM metadata
are preserved. Coordinates remain in the source Y-up.
"""
import json
import math
import struct
from pathlib import Path

import bpy
from mathutils import Vector

ROOT = Path(__file__).resolve().parent.parent
COMPONENTS = {"SCALAR": 1, "VEC2": 2, "VEC3": 3, "VEC4": 4, "MAT4": 16}
FORMATS = {5120: "b", 5121: "B", 5122: "h", 5123: "H", 5125: "I", 5126: "f"}


class Asset:
    def __init__(self, path):
        raw = path.read_bytes()
        length = struct.unpack_from("<I", raw, 12)[0]
        self.data = json.loads(raw[20:20 + length])
        self.binary = bytearray(raw[28 + length:])

    def read(self, index):
        a = self.data["accessors"][index]
        v = self.data["bufferViews"][a["bufferView"]]
        fmt = "<" + FORMATS[a["componentType"]] * COMPONENTS[a["type"]]
        size = struct.calcsize(fmt)
        offset = v.get("byteOffset", 0) + a.get("byteOffset", 0)
        rows = [struct.unpack_from(fmt, self.binary, offset + i * v.get("byteStride", size)) for i in range(a["count"])]
        if a.get("normalized"):
            divisor = {5121: 255, 5123: 65535}[a["componentType"]]
            rows = [tuple(x / divisor for x in row) for row in rows]
        return rows

    def append(self, values, kind, component=5126, target=34962):
        while len(self.binary) % 4:
            self.binary.append(0)
        offset = len(self.binary)
        fmt = "<" + FORMATS[component] * COMPONENTS[kind]
        for row in values:
            self.binary.extend(struct.pack(fmt, *row))
        views = self.data["bufferViews"]
        views.append(dict(buffer=0, byteOffset=offset, byteLength=len(self.binary) - offset, target=target))
        a = dict(bufferView=len(views) - 1, componentType=component, count=len(values), type=kind)
        if kind == "VEC3":
            a["min"] = [min(row[k] for row in values) for k in range(3)]
            a["max"] = [max(row[k] for row in values) for k in range(3)]
        self.data["accessors"].append(a)
        return len(self.data["accessors"]) - 1

    def replace(self, primitive, attributes, indices):
        primitive["attributes"] = {name: self.append(values, "VEC" + str(len(values[0])), 5123 if name.startswith("JOINTS") else 5126) for name, values in attributes.items()}
        primitive["indices"] = self.append([(i,) for i in indices], "SCALAR", 5125, 34963)

    def save(self, path):
        # Drop unreachable old geometry, including the original hair, while
        # retaining embedded image data and every live face/morph accessor.
        used = set()
        def visit(value):
            if isinstance(value, dict):
                for key, item in value.items():
                    if key == "bufferView" and isinstance(item, int):
                        used.add(item)
                    else:
                        visit(item)
            elif isinstance(value, list):
                for item in value:
                    visit(item)
        # Accessors no longer referenced by any primitive must be pruned too.
        live = set()
        for mesh in self.data["meshes"]:
            for p in mesh["primitives"]:
                live.update(p["attributes"].values())
                live.add(p["indices"])
                for morph in p.get("targets", []):
                    live.update(morph.values())
        for skin in self.data.get("skins", []):
            if "inverseBindMatrices" in skin:
                live.add(skin["inverseBindMatrices"])
        for animation in self.data.get("animations", []):
            for sampler in animation["samplers"]:
                live.update([sampler["input"], sampler["output"]])
        # Keep accessor numbers stable so all extension references remain valid.
        for i, accessor in enumerate(self.data["accessors"]):
            if i not in live:
                self.data["accessors"][i] = dict(componentType=5126, count=1, type="SCALAR", min=[0], max=[0])
        visit(self.data)
        packed, views = bytearray(), self.data["bufferViews"]
        for i, view in enumerate(views):
            if i not in used:
                continue
            while len(packed) % 4:
                packed.append(0)
            start = view.get("byteOffset", 0)
            chunk = self.binary[start:start + view["byteLength"]]
            view["byteOffset"] = len(packed)
            packed.extend(chunk)
        # Remap views after removing orphaned geometry views.
        mapping = {old: new for new, old in enumerate(sorted(used))}
        def remap(value):
            if isinstance(value, dict):
                for key, item in value.items():
                    if key == "bufferView" and isinstance(item, int):
                        value[key] = mapping[item]
                    else:
                        remap(item)
            elif isinstance(value, list):
                for item in value:
                    remap(item)
        remap(self.data)
        self.data["bufferViews"] = [views[i] for i in sorted(used)]
        self.data["buffers"][0]["byteLength"] = len(packed)
        encoded = json.dumps(self.data, separators=(",", ":")).encode()
        encoded += b" " * (-len(encoded) % 4)
        packed += b"\0" * (-len(packed) % 4)
        path.write_bytes(struct.pack("<4sII", b"glTF", 2, 28 + len(encoded) + len(packed)) + struct.pack("<I4s", len(encoded), b"JSON") + encoded + struct.pack("<I4s", len(packed), b"BIN\0") + packed)


def simplify_cloth(asset, primitive, ratio=.73):
    positions = asset.read(primitive["attributes"]["POSITION"])
    original_indices = [v[0] for v in asset.read(primitive["indices"])]
    referenced = sorted(set(original_indices))
    lookup = {old: new for new, old in enumerate(referenced)}
    indices = [lookup[i] for i in original_indices]
    data = bpy.data.meshes.new("clothing-blocks")
    data.from_pydata([positions[i] for i in referenced], [], [indices[i:i + 3] for i in range(0, len(indices), 3)])
    obj = bpy.data.objects.new("clothing-blocks", data)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    uv = asset.read(primitive["attributes"]["TEXCOORD_0"])
    layer = data.uv_layers.new(name="UVMap")
    for loop in data.loops:
        layer.data[loop.index].uv = uv[referenced[loop.vertex_index]]
    joints = asset.read(primitive["attributes"]["JOINTS_0"])
    weights = asset.read(primitive["attributes"]["WEIGHTS_0"])
    groups = {}
    for new, old in enumerate(referenced):
        for joint, weight in zip(joints[old], weights[old]):
            if weight <= 0:
                continue
            if joint not in groups:
                groups[joint] = obj.vertex_groups.new(name="joint_" + str(joint))
            groups[joint].add([new], weight, "REPLACE")
    modifier = obj.modifiers.new("Keep broad clothing planes", "DECIMATE")
    modifier.ratio = ratio
    modifier.use_collapse_triangulate = True
    bpy.ops.object.modifier_apply(modifier=modifier.name)
    data.calc_loop_triangles()
    # Keep smooth vertex normals on cloth: a lower triangle count should not
    # turn sleeves and knees into a patchwork of randomly lit triangles.
    attrs = {key: [] for key in ("POSITION", "NORMAL", "TEXCOORD_0", "JOINTS_0", "WEIGHTS_0")}
    vertex_map, result = {}, []
    for triangle in data.loop_triangles:
        for vi, li in zip(triangle.vertices, triangle.loops):
            vertex = data.vertices[vi]
            tex = tuple(data.uv_layers.active.data[li].uv)
            key = (vi, *tex)
            if key not in vertex_map:
                vertex_map[key] = len(attrs["POSITION"])
                influences = sorted([(int(obj.vertex_groups[g.group].name[6:]), g.weight) for g in vertex.groups], key=lambda x: -x[1])[:4]
                total = sum(w for _, w in influences)
                if total < .00001:
                    raise ValueError("Decimation lost skin weights")
                influences += [(0, 0)] * (4 - len(influences))
                attrs["POSITION"].append(tuple(vertex.co))
                attrs["NORMAL"].append(tuple(vertex.normal))
                attrs["TEXCOORD_0"].append(tex)
                attrs["JOINTS_0"].append(tuple(j for j, _ in influences))
                attrs["WEIGHTS_0"].append(tuple(w / total for _, w in influences))
            result.append(vertex_map[key])
    asset.replace(primitive, attrs, result)
    bpy.data.objects.remove(obj, do_unlink=True)
    bpy.data.meshes.remove(data)


def hair_geometry(kind, back=False):
    vertices, faces = [], []
    def mesh(points, triangles):
        offset = len(vertices)
        vertices.extend(points)
        faces.extend(tuple(i + offset for i in tri) for tri in triangles)
    def cap(cx, cy, cz, rx, ry, rz):
        points = [(cx, cy + ry, cz)]
        sides, rings = 12, 4
        for ring in range(1, rings + 1):
            for j in range(sides):
                a = j * math.tau / sides
                # Higher at the forehead, longer around the ears and neck.
                edge = 1.26 + 1.12 * (1 - math.cos(a)) / 2
                phi = edge * ring / rings
                points.append((cx + rx * math.sin(phi) * math.sin(a), cy + ry * math.cos(phi), cz + rz * math.sin(phi) * math.cos(a)))
        triangles = [(0, 1 + j, 1 + (j + 1) % sides) for j in range(sides)]
        for ring in range(rings - 1):
            for j in range(sides):
                a, b = 1 + ring * sides + j, 1 + ring * sides + (j + 1) % sides
                triangles.extend([(a, a + sides, b), (b, a + sides, b + sides)])
        mesh(points, triangles)
    def lock(rows):
        points = []
        for x, y, z, width, depth in rows:
            points.extend([(x - width, y, z), (x, y, z + depth), (x + width, y, z), (x, y, z - depth)])
        triangles = []
        for r in range(len(rows) - 1):
            for j in range(4):
                a, b = r * 4 + j, r * 4 + (j + 1) % 4
                triangles.extend([(a, a + 4, b), (b, a + 4, b + 4)])
        triangles.extend([(0, 1, 2), (0, 2, 3)])
        end = (len(rows) - 1) * 4
        triangles.extend([(end, end + 2, end + 1), (end, end + 3, end + 2)])
        mesh(points, triangles)
    if kind == "hero":
        cap(0, 1.638, -.021, .116, .139, .126)
        for j in range(5):
            x = (j - 2) * .036
            lock([(x, 1.716, .066, .027, .012), (x - .009, 1.669, .096, .025, .014), (x - .017, 1.628 + (j % 2) * .014, .082, .002, .002)])
        for sign in [-1, 1]:
            lock([(sign * .094, 1.681, .012, .024, .035), (sign * .109, 1.594, -.018, .022, .03), (sign * .084, 1.539, -.038, .002, .003)])
        for j in range(5):
            x = (j - 2) * .035
            lock([(x, 1.661, -.125, .027, .016), (x, 1.574, -.124, .025, .019), (x * .85, 1.512 + (j % 2) * .014, -.088, .002, .002)])
    elif back:
        cap(0, 1.642 if kind == "male" else 1.481, -.022, .106 if kind == "male" else .113, .134 if kind == "male" else .128, .12)
    elif kind == "male":
        # A single chunky tied bun replaces hundreds of small hair cards.
        for j in range(4):
            a = j * math.tau / 4
            lock([(math.sin(a) * .014, 1.729, -.133 + math.cos(a) * .014, .025, .024), (math.sin(a) * .014, 1.799, -.15 + math.cos(a) * .014, .022, .022), (0, 1.819, -.15, .002, .002)])
    else:
        # Five broad back locks and two side locks retain the long silhouette.
        for j in range(5):
            x = (j - 2) * .039
            lock([(x, 1.564, -.065, .031, .026), (x * 1.1, 1.415, -.129, .032, .035), (x * .8, 1.257, -.195, .027, .03), (x * .65, 1.173 + abs(j - 2) * .016, -.196, .003, .003)])
        for sign in [-1, 1]:
            lock([(sign * .094, 1.556, .015, .021, .028), (sign * .101, 1.421, .005, .019, .024), (sign * .083, 1.344, -.012, .002, .003)])
    return vertices, faces


def replace_hair(asset, primitive, kind, head, back):
    vertices, triangles = hair_geometry(kind, back)
    attrs = {key: [] for key in ("POSITION", "NORMAL", "TEXCOORD_0", "JOINTS_0", "WEIGHTS_0")}
    for triangle in triangles:
        a, b, c = [Vector(vertices[i]) for i in triangle]
        normal = (b - a).cross(c - a).normalized()
        for i in triangle:
            attrs["POSITION"].append(vertices[i])
            attrs["NORMAL"].append(tuple(normal))
            attrs["TEXCOORD_0"].append((0, 0))
            attrs["JOINTS_0"].append((head, 0, 0, 0))
            attrs["WEIGHTS_0"].append((1, 0, 0, 0))
    asset.replace(primitive, attrs, list(range(len(attrs["POSITION"]))))
    material = asset.data["materials"][primitive["material"]]
    material["pbrMetallicRoughness"] = dict(baseColorFactor=[.022, .019, .026, 1], roughnessFactor=1, metallicFactor=0)
    material["alphaMode"] = "OPAQUE"
    material.pop("alphaCutoff", None)
    material.pop("normalTexture", None)
    material.pop("emissiveTexture", None)
    material["emissiveFactor"] = [0, 0, 0]
    material.get("extensions", {}).pop("KHR_materials_unlit", None)


report = []
for source, kind in [("hero-ninja.glb", "hero"), ("npc_nam.vrm", "male"), ("npc_nu.vrm", "female")]:
    path = ROOT / "assets" / source
    asset = Asset(path)
    before = sum(asset.data["accessors"][p["indices"]]["count"] // 3 for m in asset.data["meshes"] for p in m["primitives"])
    for node in asset.data["nodes"]:
        if "mesh" not in node:
            continue
        skin = asset.data["skins"][node["skin"]]
        head = next(i for i, joint in enumerate(skin["joints"]) if asset.data["nodes"][joint].get("name") == "J_Bip_C_Head")
        for primitive in asset.data["meshes"][node["mesh"]]["primitives"]:
            name = asset.data["materials"][primitive["material"]].get("name", "").lower()
            if "hair" in name:
                replace_hair(asset, primitive, kind, head, "hairback" in name)
            elif ("cloth" in name or "tops" in name or "bottoms" in name) and not primitive.get("targets"):
                simplify_cloth(asset, primitive)
    after = sum(asset.data["accessors"][p["indices"]]["count"] // 3 for m in asset.data["meshes"] for p in m["primitives"])
    output = path.with_name(path.stem + "-simple" + path.suffix)
    asset.save(output)
    report.append(dict(source=source, output=output.name, originalTriangles=before, triangles=after, reduction=round(1 - after / before, 3)))
print(json.dumps(report, indent=2))
(ROOT / "assets" / "character-blocks.json").write_text(json.dumps(report, indent=2) + "\n")
