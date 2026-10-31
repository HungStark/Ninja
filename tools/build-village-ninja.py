"""Derive the village ninja rig from hero-ninja-simple.glb; originals stay intact.

Run: blender --background --python tools/build-village-ninja.py
The hand surfaces are separate so combat can use the game's detailed seal hands
without a second pair of hands or hidden sleeves. Bone names/binds are unchanged.
"""
import copy
import importlib.util
import json
from pathlib import Path
from mathutils import Matrix, Quaternion, Vector

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location("character_blocks", ROOT / "tools" / "character-blocks.py")
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
asset = module.Asset(ROOT / "assets" / "hero-ninja-simple.glb")
g = asset.data
skin_index = next(n["skin"] for n in g["nodes"] if "mesh" in n and "skin" in n)
skin = g["skins"][skin_index]
joint_names = [g["nodes"][i].get("name", "") for i in skin["joints"]]
head = joint_names.index("J_Bip_C_Head")
chest = joint_names.index("J_Bip_C_Chest")


def add_mesh(name, primitive):
    mesh = len(g["meshes"])
    g["meshes"].append(dict(name=name, primitives=[primitive]))
    node = len(g["nodes"])
    g["nodes"].append(dict(name=name, mesh=mesh, skin=skin_index))
    g["scenes"][g.get("scene", 0)]["nodes"].append(node)


def compact(primitive, indices):
    ids = sorted(set(indices))
    selected = set(ids)
    lookup = {old: new for new, old in enumerate(ids)}
    result = dict(material=primitive["material"])
    attributes = {key: [row for i, row in enumerate(asset.read(index)) if i in selected] for key, index in primitive["attributes"].items()}
    asset.replace(result, attributes, [lookup[i] for i in indices])
    return result


parents = {child: i for i, node in enumerate(g["nodes"]) for child in node.get("children", [])}
def world_matrix(i):
    node = g["nodes"][i]
    local = Matrix.LocRotScale(Vector(node.get("translation", [0,0,0])), Quaternion((node.get("rotation", [0,0,0,1])[3], *node.get("rotation", [0,0,0,1])[:3])), Vector(node.get("scale", [1,1,1])))
    return world_matrix(parents[i]) @ local if i in parents else local


hand_x = abs(world_matrix(skin["joints"][joint_names.index("J_Bip_L_Hand")]).translation.x)
def short_combat_sleeve(primitive, margin):
    """Clip the bind-pose sleeve before the wrist, interpolating skin weights.

    Dedicated combat surfaces leave room for freely rotated seal palms/cuffs;
    the exploration sleeves keep their full original length.
    """
    source = {key: asset.read(index) for key, index in primitive["attributes"].items()}
    original_indices = [row[0] for row in asset.read(primitive["indices"])]
    result = {key: [] for key in source}
    limit = hand_x - margin
    def mix(a, b, t):
        value = {key: tuple(x+(y-x)*t for x,y in zip(a[key],b[key])) for key in source if key not in ("JOINTS_0","WEIGHTS_0")}
        influences = {}
        for point, factor in ((a,1-t),(b,t)):
            for joint, weight in zip(point["JOINTS_0"], point["WEIGHTS_0"]):
                influences[joint] = influences.get(joint,0) + factor*weight
        top = sorted(influences.items(), key=lambda pair:-pair[1])[:4]
        top += [(0,0)]*(4-len(top));total=sum(w for _,w in top)
        value["JOINTS_0"] = tuple(j for j,_ in top)
        value["WEIGHTS_0"] = tuple(w/total for _,w in top)
        if "NORMAL" in value:value["NORMAL"] = tuple(Vector(value["NORMAL"]).normalized())
        return value
    for start in range(0,len(original_indices),3):
        polygon = [{key: source[key][index] for key in source} for index in original_indices[start:start+3]]
        for side in (-1,1):
            clipped=[]
            for i,a in enumerate(polygon):
                b=polygon[(i+1)%len(polygon)];da=limit-side*a["POSITION"][0];db=limit-side*b["POSITION"][0]
                if da>=0:clipped.append(a)
                if (da>=0)!=(db>=0):clipped.append(mix(a,b,da/(da-db)))
            polygon=clipped
        for i in range(1,len(polygon)-1):
            for vertex in (polygon[0],polygon[i],polygon[i+1]):
                for key in result:result[key].append(vertex[key])
    output=dict(material=primitive["material"])
    asset.replace(output,result,list(range(len(result["POSITION"]))))
    return output


hand_counts = {}
for mesh in list(g["meshes"]):
    names = mesh.get("extras", {}).get("targetNames", [])
    # Keep the useful eyelid shapes; the masked NPC does not need 57 speech
    # blendshapes on every mesh. All bind matrices and skin joints stay intact.
    keep = [i for i, n in enumerate(names) if n in ("Fcl_EYE_Close", "Fcl_EYE_Close_L", "Fcl_EYE_Close_R", "Fcl_EYE_Angry")]
    if names:
        mesh["extras"]["targetNames"] = [names[i] for i in keep]
        mesh["weights"] = [0] * len(keep)
    for primitive in mesh["primitives"]:
        if "targets" in primitive:
            primitive["targets"] = [primitive["targets"][i] for i in keep]
        material = g["materials"][primitive["material"]]
        if "tops" in material.get("name", "").lower():
            add_mesh("NinjaCombatCoat", short_combat_sleeve(primitive,.07))
        if "body_00_skin" not in material.get("name", "").lower():
            continue
        joints = asset.read(primitive["attributes"]["JOINTS_0"])
        weights = asset.read(primitive["attributes"]["WEIGHTS_0"])
        indices = [row[0] for row in asset.read(primitive["indices"])]
        groups = {"body": [], "L": [], "R": []}
        for start in range(0, len(indices), 3):
            tri = indices[start:start + 3]
            influence = {side: sum(weight for vi in tri for joint, weight in zip(joints[vi], weights[vi]) if joint_names[joint].startswith("J_Bip_" + side + "_") and any(part in joint_names[joint] for part in ("Hand", "Index", "Middle", "Ring", "Little", "Thumb"))) for side in ("L", "R")}
            side = max(influence, key=influence.get)
            groups[side if influence[side] > .75 else "body"].extend(tri)
        original = copy.deepcopy(primitive)
        primitive.clear()
        primitive.update(compact(original, groups["body"]))
        add_mesh("NinjaCombatSkin", short_combat_sleeve(primitive,.02))
        for side in ("L", "R"):
            add_mesh("NinjaNativeHand_" + side, compact(original, groups[side]))
            hand_counts[side] = len(groups[side]) // 3

# Remove the hero's crossed red chest straps and tiny clan diamond. Wrist and
# ankle bindings remain, recolored per village at runtime.
for node in g["nodes"]:
    if any(part in node.get("name", "") for part in ("Crossed Ninja Wrap", "Small Clan Mark")):
        node.pop("mesh", None)
        node.pop("skin", None)

mask_material = len(g["materials"])
g["materials"].append(dict(name="VillageNinjaMask", doubleSided=True, pbrMetallicRoughness=dict(baseColorFactor=[.025, .035, .041, 1], roughnessFactor=1, metallicFactor=0)))
vertices = [(-.096, 1.592, .045), (0, 1.589, .097), (.096, 1.592, .045), (-.078, 1.526, .027), (0, 1.522, .079), (.078, 1.526, .027), (-.099, 1.58, -.018), (-.084, 1.528, -.019), (.099, 1.58, -.018), (.084, 1.528, -.019)]
primitive = dict(material=mask_material)
asset.replace(primitive, dict(POSITION=vertices, NORMAL=[(0, 0, 1)] * len(vertices), TEXCOORD_0=[(0, 0)] * len(vertices), JOINTS_0=[(head, 0, 0, 0)] * len(vertices), WEIGHTS_0=[(1, 0, 0, 0)] * len(vertices)), [0, 3, 1, 1, 3, 4, 1, 4, 2, 2, 4, 5, 6, 7, 0, 0, 7, 3, 2, 5, 8, 8, 5, 9])
add_mesh("NinjaFaceMask", primitive)

# Uniform patches are skinned to the chest, including their village motifs.
badge_material = len(g["materials"])
g["materials"].append(dict(name="VillageNinjaBadge", alphaMode="MASK", alphaCutoff=.3, doubleSided=True, pbrMetallicRoughness=dict(baseColorFactor=[.8, .72, .45, 1], roughnessFactor=1, metallicFactor=0)))
for back in (False, True):
    x, y, z, w, h = (0, 1.32, -.151, .10, .115) if back else (-.083, 1.355, .153, .048, .055)
    primitive = dict(material=badge_material)
    points = [(x-w,y-h,z),(x+w,y-h,z),(x+w,y+h,z),(x-w,y+h,z)]
    asset.replace(primitive, dict(POSITION=points, NORMAL=[(0,0,-1 if back else 1)]*4, TEXCOORD_0=[(0,0),(1,0),(1,1),(0,1)], JOINTS_0=[(chest,0,0,0)]*4, WEIGHTS_0=[(1,0,0,0)]*4), [0,1,2,0,2,3] if not back else [0,2,1,0,3,2])
    add_mesh("NinjaVillageBadge" + ("Back" if back else "Front"), primitive)

for material in g["materials"]:
    name = material.get("name", "").lower()
    if any(k in name for k in ("tops", "bottoms", "shoes", "crimson wrap")):
        material.setdefault("pbrMetallicRoughness", {})["baseColorFactor"] = [.14, .20, .19, 1]
    if "skin" in name:
        material.setdefault("pbrMetallicRoughness", {})["baseColorFactor"] = [.72, .49, .33, 1]
g.setdefault("extras", {})["villageNinja"] = dict(source="hero-ninja.glb", optimizedSource="hero-ninja-simple.glb", separateCombatHands=True, villages=["nameless","water","fire","lightning","earth","wind","light","ice","wood","dark"])
output = ROOT / "assets" / "village-ninja.glb"
asset.save(output)
print(json.dumps(dict(file=output.name, bytes=output.stat().st_size, separateHandTriangles=hand_counts), indent=2))
