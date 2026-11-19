"""Generate the hero's embedded cloth and armor maps in glTF channel order."""

import math
import struct
import zlib


def encode_png(width, height, pixels):
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))

    stride = width * 3
    rows = bytearray()
    for row in range(height):
        start = row * stride
        scan = pixels[start:start + stride]
        rows.append(1)
        rows.extend((value - (scan[i - 3] if i >= 3 else 0)) % 256 for i, value in enumerate(scan))
    header = struct.pack('>2I5B', width, height, 8, 2, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', header) + chunk(b'IDAT', zlib.compress(rows, 9)) + chunk(b'IEND', b'')


def add_map(asset, name, width, height, pixels):
    data = encode_png(width, height, pixels)
    gltf = asset.data
    asset.binary.extend(b'\0' * (-len(asset.binary) % 4))
    views = gltf['bufferViews']
    views.append(dict(buffer=0, byteOffset=len(asset.binary), byteLength=len(data)))
    asset.binary.extend(data)
    images = gltf.setdefault('images', [])
    images.append(dict(name=name, mimeType='image/png', bufferView=len(views) - 1))
    textures = gltf.setdefault('textures', [])
    textures.append(dict(name=name, source=len(images) - 1))
    return {'index': len(textures) - 1}


def maple_maps(asset, materials):
    # Coordinates in clamped cape UV space; broader leaves follow the hem.
    leaf_outline = [(-.04, .77), (-.14, .37), (-.41, .45), (-.34, .22),
                    (-.78, .30), (-.61, -.06), (-.81, -.20), (-.43, -.32),
                    (-.52, -.43), (-.065, -.38), (-.04, -.68), (.04, -.68),
                    (.065, -.38), (.49, -.43), (.39, -.29), (.77, -.13),
                    (.61, .03), (.71, .37), (.31, .22), (.34, .49), (.12, .37)]
    leaves = [(.23,.26,.088,-.46),(.67,.34,.103,.54),(.41,.46,.071,-.36),
              (.83,.53,.097,.48),(.20,.60,.123,-.69),(.54,.65,.138,.42),
              (.67,.78,.109,-.36),(.27,.80,.149,.57),(.52,.91,.083,-.81),
              (.89,.88,.083,.74),(.12,.96,.123,-.29),(.76,.98,.153,.30)]
    polygons = []
    for rank, (u, v, size, twist) in enumerate(leaves):
        c, s = math.cos(twist), math.sin(twist)
        polygon = [(u + size * (x*c-y*s), v - size*.60 * (x*s+y*c)) for x, y in leaf_outline]
        polygons.append((polygon, (min(x for x,y in polygon), max(x for x,y in polygon),
                                   min(y for x,y in polygon), max(y for x,y in polygon)), rank))

    width, height = 256, 512
    base, emission = bytearray(), bytearray()
    for j in range(height):
        v = (j+.5)/height
        for i in range(width):
            u = (i+.5)/width
            grain = (math.sin(i*2.6) + math.cos(j*2.3)) * 1.8
            faded = 5*math.sin(32*u+7*v) + 4*math.cos(v*20-u*13) + 7*v
            border = 10 if .018 < u < .031 or .969 < u < .982 else 0
            rgb = [110+faded+grain+border, 44+faded*.45+grain+border*.45, 47+faded*.43+grain]
            glow = (0, 0, 0)
            for polygon, (left,right,top,bottom), rank in polygons:
                if not (left < u < right and top < v < bottom):
                    continue
                inside = False
                for (x0,y0),(x1,y1) in zip(polygon, polygon[1:]+polygon[:1]):
                    if (y0>v) != (y1>v) and u < (x1-x0)*(v-y0)/(y1-y0)+x0:
                        inside = not inside
                if inside:
                    distress = (math.sin(i*9.7+j*3.1)+math.cos(i*5.4-j*8.9))*4
                    strength = (24, 42, 54, 34)[rank % 4] + distress + 8*v
                    rgb = [rgb[0]+strength, rgb[1]+strength*.76, rgb[2]+strength*.37]
                    glow = (50,19,6)
                    break
            base.extend(int(value) for value in rgb)
            emission.extend(glow)

    cape = add_map(asset, 'Maple textile - base color', width, height, base)
    ember = add_map(asset, 'Maple textile - ember print', width, height, emission)
    size = 128
    weave, cloth_orm, metal_orm = bytearray(), bytearray(), bytearray()
    for j in range(size):
        for i in range(size):
            u, v = i*math.tau/size, j*math.tau/size
            nx = .19*math.cos(u*32)*math.sin(v*32)+.085*math.cos(u*12+v*16)
            ny = .19*math.cos(v*32)*math.sin(u*32)+.085*math.cos(u*12+v*16)
            weave.extend((int(127.5+nx*127),int(127.5+ny*127),int(255*(1+math.sqrt(1-nx*nx-ny*ny))/2)))
            age = math.sin(u*13+v*5) * math.sin(v*19-u*7)
            cloth_orm.extend((int(243+age*8),int(211+age*17),0))
            metal_orm.extend((int(237+age*10),int(105+age*22),255))
    normal = add_map(asset, 'Woven cloth - tangent normal', size, size, weave)
    cloth = add_map(asset, 'Woven cloth - AO roughness metallic', size, size, cloth_orm)
    forged = add_map(asset, 'Forged armor - AO roughness metallic', size, size, metal_orm)

    gltf_materials = asset.data['materials']
    for key, metal, orm in [('woven', 0, cloth), ('maple', 0, cloth), ('forged', .72, forged)]:
        pbr = dict(baseColorFactor=[1, 1, 1, 1], roughnessFactor=1, metallicFactor=metal,
                   metallicRoughnessTexture=orm)
        material = dict(name='Hero Maple PBR ' + key, doubleSided=True,
                        pbrMetallicRoughness=pbr, occlusionTexture=dict(orm, strength=.45))
        if key in ('woven', 'maple'):
            material['normalTexture'] = dict(normal, scale=.47 if key=='woven' else .72)
        if key == 'maple':
            pbr['baseColorTexture'] = cape
            material.update(emissiveTexture=ember, emissiveFactor=[.016,.011,.008])
        materials[key] = len(gltf_materials)
        gltf_materials.append(material)
