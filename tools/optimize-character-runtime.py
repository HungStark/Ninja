"""Prune unused rendering payload in derived GLBs, keeping source assets intact.

Run after character-blocks/build-village-ninja/build-ha-ly with Blender Python.
"""
import importlib.util
import json
from pathlib import Path

ROOT=Path(__file__).resolve().parent.parent
spec=importlib.util.spec_from_file_location('blocks',ROOT/'tools'/'character-blocks.py')
blocks=importlib.util.module_from_spec(spec);spec.loader.exec_module(blocks)
used_faces={'Fcl_EYE_Fun','Fcl_BRW_Fun','Fcl_MTH_Up','Fcl_EYE_Sorrow','Fcl_BRW_Sorrow','Fcl_MTH_Small','Fcl_EYE_Angry','Fcl_BRW_Angry','Fcl_MTH_Down','Fcl_EYE_Spread','Fcl_BRW_Surprised','Fcl_EYE_Joy','Fcl_BRW_Joy','Fcl_EYE_Surprised','Fcl_MTH_Neutral','Fcl_EYE_Close'}
report=[]
for filename in ['hero-ninja-simple.glb','npc_nam-simple.vrm','npc_nu-simple.vrm','village-ninja.glb']:
    path=ROOT/'assets'/filename;before=path.stat().st_size;a=blocks.Asset(path);g=a.data;maps={}
    for index,mesh in enumerate(g['meshes']):
        names=mesh.get('extras',{}).get('targetNames',[])
        if not names:continue
        keep=[] if filename.startswith('hero-') else [i for i,n in enumerate(names) if n in used_faces]
        maps[index]={old:new for new,old in enumerate(keep)}
        mesh['extras']['targetNames']=[names[i] for i in keep]
        if keep:mesh['weights']=[mesh.get('weights',[0]*len(names))[i] for i in keep]
        else:mesh.pop('weights',None)
        for p in mesh['primitives']:
            if not keep:p.pop('targets',None)
            elif 'targets' in p:p['targets']=[p['targets'][i] for i in keep]
    def remap_binds(binds,vrm1=False):
        result=[]
        for bind in binds:
            mesh=g['nodes'][bind['node']].get('mesh') if vrm1 else bind.get('mesh')
            mapping=maps.get(mesh)
            if mapping is None:result.append(bind)
            elif bind['index'] in mapping:result.append({**bind,'index':mapping[bind['index']]})
        return result
    vrm=g.get('extensions',{}).get('VRM',{})
    for group in vrm.get('blendShapeMaster',{}).get('blendShapeGroups',[]):group['binds']=remap_binds(group.get('binds',[]))
    vrm.pop('materialProperties',None)
    vrm1=g.get('extensions',{}).get('VRMC_vrm',{})
    for group in vrm1.get('expressions',{}).values():
        for expression in group.values():
            if 'morphTargetBinds' in expression:expression['morphTargetBinds']=remap_binds(expression['morphTargetBinds'],True)
    for m in g['materials']:
        m.get('extensions',{}).pop('VRMC_materials_mtoon',None)
        for key in ['normalTexture','occlusionTexture','emissiveTexture']:m.pop(key,None)
    for key in ['extensionsUsed','extensionsRequired']:
        if key in g:g[key]=[e for e in g[key] if e!='VRMC_materials_mtoon']
    texture_indices=sorted({m['pbrMetallicRoughness']['baseColorTexture']['index'] for m in g['materials'] if 'baseColorTexture' in m.get('pbrMetallicRoughness',{})})
    image_indices=sorted({g['textures'][i]['source'] for i in texture_indices})
    tm={old:new for new,old in enumerate(texture_indices)};im={old:new for new,old in enumerate(image_indices)}
    g['textures']=[{**g['textures'][i],'source':im[g['textures'][i]['source']]} for i in texture_indices]
    g['images']=[g['images'][i] for i in image_indices]
    for m in g['materials']:
        t=m.get('pbrMetallicRoughness',{}).get('baseColorTexture')
        if t:t['index']=tm[t['index']]
    vrm.get('meta',{}).pop('texture',None);vrm1.get('meta',{}).pop('thumbnailImage',None)
    a.save(path);report.append(dict(file=filename,beforeBytes=before,bytes=path.stat().st_size,maxFaceTargets=max(len(p.get('targets',[])) for m in g['meshes'] for p in m['primitives'])))
(ROOT/'assets'/'character-runtime-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
