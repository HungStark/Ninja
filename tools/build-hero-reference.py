"""Build the reference-inspired hero GLB, preserving the original humanoid rig.

Run with Blender: blender --background --python tools/build-hero-reference.py
The optimized source stays intact. New geometry is skinned in its Y-up bind
space; native face textures, eyelid morphs and finger joints remain available.
"""
import importlib.util
import json
import math
from pathlib import Path
from mathutils import Vector, Matrix, Quaternion

ROOT = Path(__file__).resolve().parent.parent
spec = importlib.util.spec_from_file_location('blocks', ROOT / 'tools/character-blocks.py')
blocks = importlib.util.module_from_spec(spec)
spec.loader.exec_module(blocks)
asset = blocks.Asset(ROOT / 'assets/hero-ninja-simple.glb')
g = asset.data
skin_index = next(n['skin'] for n in g['nodes'] if 'mesh' in n and 'skin' in n)
skin = g['skins'][skin_index]
names = [g['nodes'][i].get('name', '') for i in skin['joints']]
joint = lambda n: names.index('J_Bip_' + n)
parents = {c:i for i,n in enumerate(g['nodes']) for c in n.get('children', [])}

def world(i):
    n = g['nodes'][i]
    q = n.get('rotation', [0,0,0,1])
    m = Matrix.LocRotScale(Vector(n.get('translation', [0,0,0])), Quaternion((q[3],*q[:3])), Vector(n.get('scale', [1,1,1])))
    return world(parents[i]) @ m if i in parents else m

def point(n):
    return world(skin['joints'][joint(n)]).translation

def linear(hex_color):
    rgb = [int(hex_color[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(c/12.92 if c<=.04045 else ((c+.055)/1.055)**2.4 for c in rgb)

COLORS = dict(cloth='#302d33', edge='#443d42', red='#963e43', seam='#5c4445',
              leather='#4a3c34', leather_light='#665044', metal='#af9b82',
              steel='#aba9a4', black='#202027', hair='#25242a', hair_light='#343139')
materials = {}
for key, metallic in [('fabric',0), ('metal',.55)]:
    materials[key] = len(g['materials'])
    g['materials'].append(dict(name='Hero Reference '+key, doubleSided=True,
        pbrMetallicRoughness=dict(baseColorFactor=[1,1,1,1],roughnessFactor=.85 if key=='fabric' else .48,metallicFactor=metallic)))

# Batch all disconnected details by material and bone family, avoiding a draw
# for every stitch, lace or buckle. Colors are authored in linear vertex RGB.
groups = {}
def geometry(label, vertices, triangles, color='cloth', bone='C_Chest', metal=False, smooth=False):
    key=(label,'metal' if metal else 'fabric')
    a,ix = groups.setdefault(key, ({k:[] for k in ('POSITION','NORMAL','TEXCOORD_0','COLOR_0','JOINTS_0','WEIGHTS_0')}, []))
    normals = [Vector((0,0,0)) for _ in vertices]
    if smooth:
        for tri in triangles:
            p,q,r = (Vector(vertices[i]) for i in tri)
            normal = (q-p).cross(r-p)
            for i in tri:normals[i] += normal
    for tri in triangles:
        p,q,r = (Vector(vertices[i]) for i in tri)
        normal = (q-p).cross(r-p).normalized()
        for i in tri:
            ix.append(len(a['POSITION']))
            a['POSITION'].append(tuple(vertices[i]))
            a['NORMAL'].append(tuple(normals[i].normalized() if smooth else normal))
            a['TEXCOORD_0'].append((0,0))
            a['COLOR_0'].append(linear(COLORS.get(color,color)))
            influences=bone(vertices[i]) if callable(bone) else ((joint(bone),0,0,0),(1,0,0,0))
            a['JOINTS_0'].append(influences[0])
            a['WEIGHTS_0'].append(influences[1])

def box(label, center, size, color, bone='C_Chest', metal=False, rotate=0, bevel=.002):
    x,y,z = center;w,h,d = size;b = min(bevel,w*.25,h*.25)
    outline=[(-w/2+b,-h/2),(w/2-b,-h/2),(w/2,-h/2+b),(w/2,h/2-b),(w/2-b,h/2),(-w/2+b,h/2),(-w/2,h/2-b),(-w/2,-h/2+b)]
    c,s=math.cos(rotate),math.sin(rotate)
    v=[(x+px*c-py*s,y+px*s+py*c,z+pz) for pz in (-d/2,d/2) for px,py in outline]
    f=[]
    for i in range(1,7):f.extend([(0,i+1,i),(8,8+i,9+i)])
    for i in range(8):
        j=(i+1)%8;f.extend([(i,j,8+i),(j,8+j,8+i)])
    geometry(label,v,f,color,bone,metal)

def ribbon(label, points, width, color, bone='C_Chest', metal=False):
    v=[]
    for i,p in enumerate(points):
        delta=Vector(points[min(i+1,len(points)-1)])-Vector(points[max(0,i-1)])
        right=Vector((-delta.y,delta.x,0)).normalized()*width*.5
        v.extend([tuple(Vector(p)-right),tuple(Vector(p)+right)])
    f=[]
    for i in range(len(points)-1):
        a=i*2;f.extend([(a,a+1,a+2),(a+1,a+3,a+2)])
    geometry(label,v,f,color,bone,metal)

def tube(label, rows, color, bone='C_Chest', sides=20, start=0, end=math.tau):
    # Each row: center x, y, z, radius x, radius z.
    v=[]
    for x,y,z,rx,rz in rows:
        for i in range(sides+1):
            t=start+(end-start)*i/sides
            v.append((x+math.sin(t)*rx,y,z+math.cos(t)*rz))
    f=[]
    for row in range(len(rows)-1):
        for i in range(sides):
            a=row*(sides+1)+i;b=a+sides+1
            f.extend([(a,b,a+1),(a+1,b,b+1)])
    geometry(label,v,f,color,bone,smooth=True)

def buckle(label,x,y,z,w,h,bone='C_Chest',rotate=0):
    for dx,dy,bw,bh in [(-w/2,0,.003,h),(w/2,0,.003,h),(0,-h/2,w,.003),(0,h/2,w,.003),(0,0,.002,h)]:
        c,s=math.cos(rotate),math.sin(rotate)
        box(label,(x+dx*c-dy*s,y+dx*s+dy*c,z),(bw,bh,.005),'metal',bone,True,rotate,bevel=.0005)

def diamond(label,x,y,z,w,h,bone='C_Chest'):
    geometry(label,[(x,y+h/2,z),(x+w/2,y,z),(x,y-h/2,z),(x-w/2,y,z),(x,y,z+.008)],
        [(0,1,4),(1,2,4),(2,3,4),(3,0,4)],'metal',bone,True)

# Remove the earlier angular hair and the floating X. Native clothing, eyes and
# hand topology stay in the asset. The new mask is integrated into the GLB.
ankle_weights={}
for n in g['nodes']:
    if 'Ninja Ankle Tie' in n.get('name',''):
        p=g['meshes'][n['mesh']]['primitives'][0]
        positions=asset.read(p['attributes']['POSITION'])
        joints=asset.read(p['attributes']['JOINTS_0']);weights=asset.read(p['attributes']['WEIGHTS_0'])
        ankle_weights[1 if sum(p[0] for p in positions)>0 else -1]=list(zip(positions,joints,weights))
    if any(t in n.get('name','') for t in ('Crossed Ninja Wrap','Small Clan Mark','Ninja Ankle Tie','Ninja Wrist Tie')):
        n.pop('mesh',None);n.pop('skin',None)
    if 'mesh' in n and any('hair' in g['materials'][p['material']].get('name','').lower() for p in g['meshes'][n['mesh']]['primitives']):
        n.pop('mesh',None);n.pop('skin',None)
for mesh in g['meshes']:
    mesh['primitives']=[p for p in mesh['primitives'] if 'facebrow' not in g['materials'][p['material']].get('name','').lower()]
    for p in mesh['primitives']:
        if 'bottoms' not in g['materials'][p['material']].get('name','').lower():continue
        attrs={key:asset.read(index) for key,index in p['attributes'].items()}
        fitted=[]
        for x,y,z in attrs['POSITION']:
            t=max(0,min(1,(.38-y)/.08))
            center=point('L_Foot' if x>0 else 'R_Foot').x
            fitted.append((center+(x-center)*(1-.12*t),.295+(y-.3)*.1 if y<.3 else y,z*(1-.17*t)))
        attrs['POSITION']=fitted
        asset.replace(p,attrs,[row[0] for row in asset.read(p['indices'])])

# Layered, swept hair. A closed skull cap sits underneath the tapered locks.
v=[(0,1.785,-.025)];sides=24;rings=8
for row in range(1,rings+1):
    for i in range(sides):
        t=i*math.tau/sides;edge=1.28+.98*(1-math.cos(t))*.5;phi=edge*row/rings
        v.append((.12*math.sin(phi)*math.sin(t),1.646+.139*math.cos(phi),-.025+.12*math.sin(phi)*math.cos(t)))
f=[(0,1+(i+1)%sides,1+i) for i in range(sides)]
for row in range(rings-1):
    for i in range(sides):
        a=1+row*sides+i;b=1+row*sides+(i+1)%sides
        f.extend([(a,b,a+sides),(b,b+sides,a+sides)])
geometry('Hair',v,f,'hair','C_Head',smooth=True)

def lock(rows,shade='hair'):
    v=[]
    for i,(x,y,z,w,d) in enumerate(rows):
        p=Vector((x,y,z))
        tangent=(Vector(rows[min(i+1,len(rows)-1)][:3])-Vector(rows[max(0,i-1)][:3])).normalized()
        across=Vector((0,0,1)).cross(tangent).normalized();depth=tangent.cross(across).normalized()
        v.extend([tuple(p+across*a*w+depth*b*d) for a,b in [(-1,0),(-.4,.8),(.35,1),(1,0),(0,-.55)]])
    f=[]
    for row in range(len(rows)-1):
        for i in range(5):
            a=row*5+i;b=row*5+(i+1)%5;f.extend([(a,b,a+5),(b,b+5,a+5)])
    f.extend([(0,2,1),(0,3,2),(0,4,3)])
    geometry('Hair',v,f,shade,'C_Head',smooth=True)

for i in range(8):
    x=(i-3.5)*.027;tip=1.635+(.018 if i%2 else 0)-(.025 if i in (0,7) else 0)
    sweep=[.008,-.012,.014,-.006,.018,.004,-.01,.006][i]
    lock([(x+sweep,1.728+(i%3)*.012,.067,.022,.012),(x+.004,1.696,.101,.023,.015),(x-.004+sweep,1.665,.111,.018,.013),(x-.012+sweep,tip,.101,.001,.001)],'hair_light' if i in (1,5) else 'hair')
for side in (-1,1):
    for i in range(3):
        lock([(side*(.075+i*.013),1.743-i*.016,-.01-i*.028,.025,.022),(side*(.116+i*.007),1.677-i*.016,.005-i*.035,.029,.026),(side*(.13+i*.004),1.604-i*.016,-.004-i*.031,.022,.018),(side*(.112+i*.009),1.553-i*.009,-.015-i*.025,.001,.001)],'hair_light' if i==1 else 'hair')
for i in range(9):
    t=(i+1)*math.pi/10+math.pi/2
    x,z=math.sin(t),math.cos(t)
    lock([(x*.07,1.74,-.03+z*.07,.026,.02),(x*.115,1.675,-.03+z*.115,.029,.026),(x*.13,1.598,-.025+z*.12,.025,.023),(x*.12,1.544+(i%2)*.013,-.025+z*.1,.001,.001)],'hair_light' if i%3==0 else 'hair')
for i in range(6):
    x=(i-2.5)*.027
    lock([(x+.023,1.735,-.031,.024,.021),(x+.009,1.764+(i%2)*.008,-.015,.026,.022),(x-.014,1.782,-.001,.018,.014),(x-.032,1.779-(i%3)*.008,.012,.001,.001)],'hair_light' if i==1 else 'hair')

tube('Mask',[(0,1.595,.002,.101,.103),(0,1.574,.002,.104,.099),(0,1.533,-.005,.09,.086),(0,1.521,-.008,.082,.077)],'black','C_Head',24,-math.pi*.64,math.pi*.64)
tube('Mask',[(0,1.596,.002,.102,.104),(0,1.593,.002,.102,.104)],'edge','C_Head',24,-math.pi*.64,math.pi*.64)
for side in (-1,1):
    geometry('Brows',[(side*.02,1.632,.074),(side*.022,1.638,.074),(side*.071,1.643,.054),(side*.069,1.638,.055)],[(0,1,2),(0,2,3)],'hair','C_Head')

# High collar with red piping and two leather closure tabs.
tube('Collar',[(0,1.456,-.005,.119,.108),(0,1.49,-.003,.124,.108),(0,1.548,0,.122,.106)],'cloth')
tube('Collar',[(0,1.545,0,.123,.107),(0,1.552,0,.124,.108)],'red')
for y in (1.495,1.53):
    box('Collar',(-.035,y,.111),(.061,.016,.009),'leather')
    box('Collar',(-.036,y,.119),(.024,.022,.007),'red')
    for x in (-.059,-.012):box('Collar',(x,y,.118),(.004,.004,.004),'metal',metal=True)
    buckle('Collar',-.036,y,.124,.015,.013)

# Short asymmetric shoulder mantle: multiple rings create a folded silhouette.
def mantle_point(t,r):
    front=max(0,math.cos(t));side=math.sin(t)
    inner=Vector((.114*side,1.478,-.005+.103*math.cos(t)))
    hem=Vector((.236*side,1.319+.062*abs(side)-.04*side*front,-.016+(.192 if front else .177)*math.cos(t)))
    p=inner.lerp(hem,r);p.y+=math.sin(r*math.pi)*.019
    return tuple(p)
v=[mantle_point(i*math.tau/40,r) for r in (0,.28,.63,1) for i in range(41)]
f=[]
for row in range(3):
    for i in range(40):
        a=row*41+i;b=a+41;f.extend([(a,a+1,b),(a+1,b+1,b)])
geometry('Mantle',v,f,'cloth',smooth=True)
v=[mantle_point(i*math.tau/40,r) for r in (.972,1) for i in range(41)]
geometry('Mantle',v,[(i,i+1,i+41) for i in range(40)]+[(i+1,i+42,i+41) for i in range(40)],'red',smooth=True)
# Diagonal overlapping front fold and the crimson shoulder sigil.
v=[]
for t,r in [(-.8,.08),(-.52,.37),(-.21,.69),(.03,.98)]:
    for dt in (-.028,.028):
        p=list(mantle_point(t+dt,r));p[1]+=.003;p[2]+=.005;v.append(p)
geometry('Mantle',v,[(i,i+1,i+2) for i in (0,2,4)]+[(i+1,i+3,i+2) for i in (0,2,4)],'edge')
for flip in (-1,1):
    coords=[(.77-.17,.73-flip*.12),(.77+.17,.73+flip*.12)]
    v=[]
    for t,r in coords:
        for dt in (-.025,.025):
            p=list(mantle_point(t+dt,r));p[2]+=.003;v.append(p)
    geometry('Mantle',v,[(0,1,2),(1,3,2)],'red')
diamond('Mantle',-.008,1.355,.199,.018,.025)

# Crossed chest harness follows the shape of the tunic, with depth at the X.
for side in (-1,1):
    ribbon('Harness',[(side*.108,1.337,.145),(side*.065,1.255,.154),(-side*.044,1.123,.16),(-side*.117,1.018,.146)],.031,'red')
    ribbon('Harness',[(side*.103,1.334,.148),(side*.06,1.254,.157),(-side*.049,1.122,.163),(-side*.122,1.018,.149)],.002,'seam')
diamond('Harness',0,1.272,.165,.032,.048)
for x in (-.085,.085):buckle('Harness',x,1.104,.169,.027,.03,rotate=x*4)

# A separate waist belt and split hip panels remove the plain long-shirt read.
tube('Belt',[(0,1.035,0,.174,.149),(0,1.085,0,.172,.147)],'leather','C_Hips',32)
for x in (-.13,-.064,.064,.13):box('Belt',(x,1.061,.143),(.013,.065,.013),'black','C_Hips')
buckle('Belt',.015,1.062,.16,.05,.035,'C_Hips',-.04)
for side in (-1,1):
    v=[(side*.022,1.033,.147),(side*.166,1.033,.116),(side*.184,.856,.116),(side*.077,.813,.143),(side*.03,.866,.15)]
    geometry('HipPanels',v,[(0,1,2),(0,2,3),(0,3,4)],'cloth','C_Hips')
    ribbon('HipPanels',[v[1],v[2],v[3]],.003,'edge','C_Hips')
    back=[(side*.018,1.033,-.148),(side*.165,1.033,-.118),(side*.18,.858,-.121),(side*.055,.835,-.153)]
    geometry('HipPanels',back,[(0,2,1),(0,3,2)],'cloth','C_Hips')
    ribbon('Belt',[(side*.12,1.09,-.119),(side*.06,1.235,-.147),(-side*.106,1.411,-.12)],.022,'leather','C_Chest')
box('Belt',(.071,.953,.169),(.034,.15,.008),'red','C_Hips',rotate=.08)
diamond('Belt',.072,.952,.176,.022,.035,'C_Hips')

# Forearm guards and fingerless glove cuffs. The source is in a T-pose, so
# their cylinder axis runs along X and all details inherit the forearm joint.
def sleeve(side,rows,color):
    bone=('L' if side>0 else 'R')+'_LowerArm';v=[];steps=16
    for x,ry,rz in rows:
        for i in range(steps+1):
            t=i*math.tau/steps;v.append((side*x,1.419+math.sin(t)*ry,-.027+math.cos(t)*rz))
    f=[]
    for row in range(len(rows)-1):
        for i in range(steps):
            a=row*(steps+1)+i;b=a+steps+1;f.extend([(a,a+1,b),(a+1,b+1,b)])
    geometry('Gloves',v,f,color,bone,smooth=True)
for side in (-1,1):
    bone=('L' if side>0 else 'R')+'_LowerArm'
    sleeve(side,[(.487,.074,.077),(.525,.068,.071),(.573,.057,.06),(.603,.047,.049)],'black')
    for x in (.492,.566):
        sleeve(side,[(x-.012,.076 if x<.5 else .06,.08 if x<.5 else .064),(x+.012,.076 if x<.5 else .06,.08 if x<.5 else .064)],'red')
        buckle('Gloves',side*x,1.42,.056,.023,.027,bone)
    diamond('Gloves',side*.544,1.42,.05,.032,.043,bone)

# Taller combat boots, layered soles, leather straps, laces and warm metal tabs.
for side in (-1,1):
    leg=('L' if side>0 else 'R')+'_LowerLeg';foot=('L' if side>0 else 'R')+'_Foot'
    x=point(foot).x
    tube('Boots',[(x,.095,-.008,.057,.066),(x,.18,-.006,.057,.064),(x,.265,-.009,.062,.066)],'black',leg,20)
    def cuff_weights(p):
        nearest=min(ankle_weights[side],key=lambda entry:sum((a-b)**2 for a,b in zip(p,entry[0])))
        return nearest[1],nearest[2]
    tube('Boots',[(x,.273,-.022,.086,.108),(x,.305,-.022,.086,.108)],'red',cuff_weights,20)
    for y in (.148,.228):
        tube('Boots',[(x,y-.009,-.005,.059,.068),(x,y+.009,-.005,.059,.068)],'leather',leg,16)
    tube('Boots',[(x,.024,.032,.065,.121),(x,.044,.032,.065,.121),(x,.068,.035,.061,.112),(x,.089,.025,.05,.09),(x,.105,.003,.038,.067)],'black',foot,24)
    tube('Boots',[(x,.004,.032,.068,.124),(x,.018,.032,.068,.124),(x,.024,.032,.066,.122)],'edge',foot,24)
    for i in range(4):
        y=.111+i*.029;z=.067
        for flip in (-1,1):
            ribbon('Boots',[(x-flip*.028,y-.009,z),(x+flip*.026,y+.012,z)],.004,'leather_light',leg)
    diamond('Boots',x,.235,.067,.03,.039,leg)

# Export skinned batches. Source skin joint order and inverse bind matrices
# are reused exactly, so existing animation and equipment attachment still work.
for (label,kind),(attributes,indices) in groups.items():
    primitive=dict(material=materials[kind]);asset.replace(primitive,attributes,indices)
    index=len(g['meshes']);name='HeroReference'+label+('Metal' if kind=='metal' else '')
    g['meshes'].append(dict(name=name,primitives=[primitive]))
    node=len(g['nodes']);g['nodes'].append(dict(name=name,mesh=index,skin=skin_index))
    g['scenes'][g.get('scene',0)]['nodes'].append(node)
metadata=dict(version=1,source='hero-ninja-simple.glb',integratedMask=True,rigPreserved=True)
g.setdefault('extras',{})['heroReference']=metadata
g['scenes'][g.get('scene',0)].setdefault('extras',{})['heroReference']=metadata
output=ROOT/'assets/hero-ninja-reference.glb';asset.save(output)
report=dict(file=output.name,bytes=output.stat().st_size,addedTriangles=sum(len(ix)//3 for _,ix in groups.values()),batches=len(groups),bones=len(skin['joints']))
(ROOT/'assets/hero-reference-report.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
