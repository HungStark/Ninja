"""Build a lightweight rigged Ha Ly from the original VRM, not the baked GLB.

blender --background --python tools/build-ha-ly.py -- --source path/to/hehe.vrm
The source and assets/ha-ly.glb remain unchanged.
"""
import argparse
import importlib.util
import json
import sys
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent.parent
parser=argparse.ArgumentParser()
parser.add_argument('--source',type=Path,required=True)
args=parser.parse_args(sys.argv[sys.argv.index('--')+1:])
spec=importlib.util.spec_from_file_location('blocks',ROOT/'tools'/'character-blocks.py')
blocks=importlib.util.module_from_spec(spec);spec.loader.exec_module(blocks)
asset=blocks.Asset(args.source)

# The baked GLB had no morphs. Keep only the rigged expressions used by the
# game rather than uploading 57 copies of face deltas to the GPU.
morph_maps={}
for index,mesh in enumerate(asset.data['meshes']):
    names=mesh.get('extras',{}).get('targetNames',[])
    if not names:continue
    keep=[i for i,n in enumerate(names) if n in ('Fcl_EYE_Close','Fcl_EYE_Close_L','Fcl_EYE_Close_R','Fcl_BRW_Sorrow','Fcl_MTH_Small')]
    morph_maps[index]={old:new for new,old in enumerate(keep)}
    mesh['extras']['targetNames']=[names[i] for i in keep]
    mesh['weights']=[0]*len(keep)
    for p in mesh['primitives']:
        if 'targets' in p:p['targets']=[p['targets'][i] for i in keep]
for group in asset.data.get('extensions',{}).get('VRMC_vrm',{}).get('expressions',{}).values():
    for expression in group.values():
        binds=[]
        for bind in expression.get('morphTargetBinds',[]):
            mesh=asset.data['nodes'][bind['node']].get('mesh')
            mapping=morph_maps.get(mesh,{})
            if bind['index'] in mapping:binds.append({**bind,'index':mapping[bind['index']]})
        if 'morphTargetBinds' in expression:expression['morphTargetBinds']=binds

def long_hair():
    vertices,faces=blocks.hair_geometry('female',False)
    def lock(rows):
        start=len(vertices)
        for x,y,z,w,d in rows:vertices.extend([(x-w,y,z),(x,y,z+d),(x+w,y,z),(x,y,z-d)])
        for r in range(len(rows)-1):
            for j in range(4):
                a=start+r*4+j;b=start+r*4+(j+1)%4
                faces.extend([(a,a+4,b),(b,a+4,b+4)])
    for i in range(5):
        x=(i-2)*.035
        lock([(x,1.59,.052,.027,.014),(x-.008,1.545,.094,.025,.014),(x-.015,1.492+(i%2)*.012,.079,.002,.002)])
    for side in [-1,1]:lock([(side*.104,1.53,.02,.027,.027),(side*.121,1.36,.013,.025,.022),(side*.13,1.235,-.015,.002,.002)])
    return vertices,faces

original=0
for m in asset.data['meshes']:
    for p in m['primitives']:original+=asset.data['accessors'][p['indices']]['count']//3
for node in asset.data['nodes']:
    if 'mesh' not in node:continue
    skin=asset.data['skins'][node['skin']]
    head=next(i for i,j in enumerate(skin['joints']) if asset.data['nodes'][j].get('name')=='J_Bip_C_Head')
    for p in asset.data['meshes'][node['mesh']]['primitives']:
        material=asset.data['materials'][p['material']];name=material.get('name','').lower()
        if 'hair' in name:
            if 'hairback' in name:blocks.replace_hair(asset,p,'female',head,True)
            else:
                vertices,faces=long_hair();attrs={k:[] for k in ['POSITION','NORMAL','TEXCOORD_0','JOINTS_0','WEIGHTS_0']}
                for face in faces:
                    a,b,c=[Vector(vertices[i]) for i in face];normal=(b-a).cross(c-a).normalized()
                    for i in face:
                        attrs['POSITION'].append(vertices[i]);attrs['NORMAL'].append(tuple(normal));attrs['TEXCOORD_0'].append((0,0));attrs['JOINTS_0'].append((head,0,0,0));attrs['WEIGHTS_0'].append((1,0,0,0))
                asset.replace(p,attrs,list(range(len(attrs['POSITION']))))
                material['pbrMetallicRoughness']=dict(baseColorFactor=[.025,.015,.014,1],roughnessFactor=1,metallicFactor=0)
                material['alphaMode']='OPAQUE';material.pop('alphaCutoff',None)
        elif not p.get('targets') and ('cloth' in name or 'body_00_skin' in name):blocks.simplify_cloth(asset,p,.62 if 'body_00_skin' in name else .68)
        material.get('extensions',{}).pop('KHR_materials_unlit',None)
        material.get('extensions',{}).pop('VRMC_materials_mtoon',None)
        material.pop('normalTexture',None);material.pop('occlusionTexture',None)
        material['emissiveFactor']=[0,0,0];material.pop('emissiveTexture',None)
        material.setdefault('pbrMetallicRoughness',{}).update(roughnessFactor=1,metallicFactor=0)
# Discard old hair, matcap and normal images now that surfaces use the scene's
# toon lighting. Preserve VRM author/license metadata; the unused thumbnail
# alone occupies 1.5 MB and is not needed by this in-game GLB.
g=asset.data
used_textures=sorted({m['pbrMetallicRoughness']['baseColorTexture']['index'] for m in g['materials'] if 'baseColorTexture' in m.get('pbrMetallicRoughness',{})})
meta=g.get('extensions',{}).get('VRMC_vrm',{}).get('meta',{})
meta.pop('thumbnailImage',None)
used_images={g['textures'][i]['source'] for i in used_textures}
image_map={old:new for new,old in enumerate(sorted(used_images))}
texture_map={old:new for new,old in enumerate(used_textures)}
g['textures']=[{**g['textures'][i],'source':image_map[g['textures'][i]['source']]} for i in used_textures]
g['images']=[g['images'][i] for i in sorted(used_images)]
for material in g['materials']:
    texture=material.get('pbrMetallicRoughness',{}).get('baseColorTexture')
    if texture:texture['index']=texture_map[texture['index']]
for key in ('extensionsUsed','extensionsRequired'):
    if key in g:g[key]=[e for e in g[key] if e not in ('KHR_materials_unlit','VRMC_materials_mtoon')]
after=sum(asset.data['accessors'][p['indices']]['count']//3 for m in asset.data['meshes'] for p in m['primitives'])
asset.data.setdefault('extras',{})['haLy']={'rigged':True,'source':'original user-supplied VRM','triangles':after}
asset.save(ROOT/'assets'/'ha-ly-simple.glb')
report={'sourceTriangles':47296,'riggedSourceTriangles':original,'triangles':after,'reduction':round(1-after/47296,3),'rigged':True,'bytes':(ROOT/'assets'/'ha-ly-simple.glb').stat().st_size}
(ROOT/'assets'/'ha-ly-simple.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
