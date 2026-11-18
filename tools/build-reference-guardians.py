"""Five reference-sheet guardians, authored in Blender and exported for the game.

Y-up / +Z forward modelling coordinates; Blender meshes are Z-up. Indexed,
quantized geometry is embedded in the game for synchronous offline spawning.
The .blend and five GLBs also retain a real articulated armature.
"""
import bpy
import math
import json
import random
import struct
import base64
from pathlib import Path
from mathutils import Vector

ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'assets/guardians'
OUT.mkdir(parents=True,exist_ok=True)
SECOND_SET=globals().get('SECOND_SET',False)
SCENE='Five Guardian Workshop II' if SECOND_SET else 'Five Guardian Workshop'
scene=bpy.data.scenes.get(SCENE) or bpy.data.scenes.new(SCENE)
bpy.context.window.scene=scene
for obj in list(scene.objects):
    bpy.data.objects.remove(obj,do_unlink=True)
random.seed(1906)
MODELS={}
ZUP=lambda p:(p[0],-p[2],p[1])

def rgb(hex):
    a=[int(hex[i:i+2],16)/255 for i in (1,3,5)]
    return tuple(v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in a)

def curve(points,t):
    """Interpolating Catmull-Rom spline with clamped endpoints."""
    x=t*(len(points)-1);i=min(len(points)-2,int(x));f=x-i
    a,b,c,d=[Vector(points[max(0,min(len(points)-1,j))]) for j in (i-1,i,i+1,i+2)]
    return (b*2+(c-a)*f+(a*2-b*5+c*4-d)*f*f+(-a+b*3-c*3+d)*f*f*f)*.5

class Sculpt:
    def __init__(self,id):
        self.id=id;self.parts={};self.groups={};self.flow_path=None
        self.part('torso',(0,0,0))
    def part(self,name,pivot=(0,0,0),parent=None):
        self.parts[name]={'pivot':list(pivot),'parent':parent}
        return name
    def add(self,part,v,f,color,kind='fur',tip=None,flow=None):
        key=(part,kind)
        group=self.groups.setdefault(key,{'p':[],'i':[],'c':[],'flow':[]})
        start=len(group['p']);base=rgb(color);end=rgb(tip or color)
        for k,p in enumerate(v):
            group['p'].append(tuple(p))
            t=k/max(1,len(v)-1) if tip else 0
            shade=.93+.06*math.sin(p[0]*3+p[1]*2.1+p[2]*1.7)
            group['c'].append(tuple((a*(1-t)+b*t)*shade for a,b in zip(base,end)))
            group['flow'].append(flow[k] if flow is not None else -1)
        for face in f:
            for j in range(1,len(face)-1):
                a,b,c=(start+face[k] for k in (0,j,j+1))
                av,bv,cv=(Vector(group['p'][k]) for k in (a,b,c))
                if (bv-av).cross(cv-av).length_squared>1e-14:
                    group['i'].extend((a,b,c))
    def ell(self,part,p,s,color,kind='fur',segments=16,rings=9):
        v=[(p[0],p[1]+s[1],p[2])]
        for row in range(1,rings):
            phi=math.pi*row/rings
            for j in range(segments):
                a=j*math.tau/segments
                v.append((p[0]+s[0]*math.sin(phi)*math.sin(a),p[1]+s[1]*math.cos(phi),p[2]+s[2]*math.sin(phi)*math.cos(a)))
        v.append((p[0],p[1]-s[1],p[2]));bottom=len(v)-1
        f=[(0,1+j,1+(j+1)%segments) for j in range(segments)]
        for row in range(rings-2):
            for j in range(segments):
                a=1+row*segments+j;b=1+row*segments+(j+1)%segments
                f.append((a,a+segments,b+segments,b))
        last=1+(rings-2)*segments
        f.extend((bottom,last+(j+1)%segments,last+j) for j in range(segments))
        self.add(part,v,f,color,kind)
    def strand(self,part,points,width,color,tip=None,depth=.65,segments=9,sides=7,kind='fur',profile=None,flow=False):
        v=[];weights=[];previous_right=None
        for row in range(segments+1):
            t=row/segments;p=curve(points,t)
            tangent=(curve(points,min(1,t+.002))-curve(points,max(0,t-.002))).normalized()
            right=previous_right-tangent*previous_right.dot(tangent) if previous_right is not None else tangent.cross(Vector((0,1,0)))
            if right.length<.01:right=tangent.cross(Vector((1,0,0)))
            right.normalize();previous_right=right.copy();up=right.cross(tangent).normalized()
            r=width*((.07+math.sin(math.pi*t)**.85)*(1-.8*t**8) if profile=='plume' else (.025+.975*math.sin(t*math.pi*.5)) if profile=='dragon' else 1 if profile=='line' else .55+.45*math.cos(t*math.pi*.5) if profile=='limb' else (1-t)**.72+.012)
            for j in range(sides):
                a=j*math.tau/sides
                q=p+right*(math.cos(a)*r)+up*(math.sin(a)*r*depth)
                v.append(tuple(q));weights.append(t)
        f=[]
        for row in range(segments):
            for j in range(sides):
                a=row*sides+j;b=row*sides+(j+1)%sides
                f.append((a,a+sides,b+sides,b))
        f.append(tuple(range(sides)));f.append(tuple(segments*sides+j for j in reversed(range(sides))))
        self.add(part,v,f,color,kind,tip,weights if flow else None)
    def line(self,part,points,r,color,kind='metal'):
        self.strand(part,points,r,color,depth=1,segments=max(5,len(points)*2),sides=5,kind=kind,profile='line')
    def leaf(self,part,a,b,w,color,tip=None,kind='fur',bend=.1,normal=(0,0,1)):
        """A curved ridged feather/fur lock, rather than a cone or leaf card."""
        a,b=Vector(a),Vector(b);d=b-a
        right=d.cross(Vector(normal))
        if right.length<.01:right=d.cross(Vector((0,1,0)))
        right.normalize();normal=right.cross(d).normalized();v=[]
        for t,width in [(0,.23),(.25,.88),(.56,1),(.82,.63),(1,0)]:
            p=a+d*t+normal*(math.sin(t*math.pi)*bend)
            for side in (-1,0,1):
                q=p+right*(side*w*width)+normal*((1-abs(side))*w*.2)
                v.append(tuple(q))
        f=[]
        for row in range(4):
            for k in range(2):
                i=row*3+k;f.append((i,i+1,i+4,i+3))
        self.add(part,v,f,color,kind,tip)
    def rune(self,part,p,size,color,kind='glow',axis='front'):
        for arm in range(3):
            points=[]
            for k in range(10):
                t=k/9;a=arm*math.tau/3+t*math.pi*1.25;r=size*(.1+.86*t)
                points.append((p[0]+math.sin(a)*r,p[1]+math.cos(a)*r,p[2]) if axis=='front' else (p[0],p[1]+math.cos(a)*r,p[2]+math.sin(a)*r))
            self.line(part,points,size*.09,color,kind)
    def armor(self,part,p,s,color='#a6a3b0'):
        x,y,z=p;w,h=s
        self.leaf(part,(x,y+h*.5,z),(x,y-h*.5,z+.12),w,color,kind='metal',bend=.14)
        for side in (-1,1):
            self.line(part,[(x,y+h*.5,z+.015),(x+side*w*.83,y+h*.15,z+.13),(x+side*w*.6,y-h*.23,z+.16),(x,y-h*.5,z+.14)],.035,'#c3a26b')

def canine(id):
    m=Sculpt(id);fire=id=='fire';neutral=id=='nameless'
    body='#a12d28' if fire else '#707584' if neutral else '#4d4268'
    fur='#ede9df' if fire or neutral else '#b9b6ce';edge='#ba4b35' if fire else '#bcbfc6' if neutral else '#74639d'
    energy='#ffb037' if fire else '#f5cf8f' if neutral else '#b779ff'
    m.ell('torso',(0,2.65,-.45),(1.0,1.02,1.95),body)
    m.ell('torso',(0,2.87,.92),(1.02,1.23,.93),fur)
    m.ell('torso',(0,3.8,1.36),(.72,1.12,.72),fur)
    m.ell('torso',(0,2.65,-1.65),(.89,.96,.8),body)
    # Layered chest and neck fur, directed down and out from the face.
    for row in range(6):
        for j in range(9):
            a=(j-4)*.32;x=math.sin(a)*(.62+row*.055);y=4.55-row*.31;z=1.60+math.cos(a)*.45-row*.035
            m.leaf('torso',(x,y,z),(x*1.31,y-.78-(j%2)*.13,z+.20),.15+row*.013,edge if j%4==0 else fur,fur,bend=.10)
    # Back and hip locks preserve a strong, muscular silhouette.
    for side in (-1,1):
        for row in range(4):
            for j in range(7):
                x=side*(.67+row*.10);y=3.5-row*.33;z=1.05-j*.46
                m.leaf('torso',(x,y,z),(x+side*.30,y-.52,z-.35),.15,body,edge)
    # Digitigrade legs: muscular upper segments, angled hocks and wide paws.
    for side in (-1,1):
        for front in (True,False):
            tag=('front' if front else 'back')+('-left' if side>0 else '-right')
            z=1.05 if front else -1.5;x=side*.85
            upper=m.part(tag,(x,2.55,z));lower=m.part(tag+'-knee',(x,1.12,z+(.05 if front else -.12)),upper)
            foot=m.part(tag+'-foot',(x,.34,z+.3),lower)
            m.strand(upper,[(x,2.55,z),(x*1.08,1.94,z-.12),(x,1.12,z+(.05 if front else -.12))],.34 if front else .42,body,fur,segments=9,sides=10,profile='limb')
            m.strand(lower,[(x,1.18,z),(x, .68,z+.08),(x,.28,z+.32)],.23,'#40414d' if not fire else '#41383e',segments=7,sides=9,profile='limb')
            m.ell(foot,(x,.25,z+.48),(.35,.25,.48),body,segments=12,rings=6)
            for toe in range(3):
                px=x+(toe-1)*.19
                m.ell(foot,(px,.20,z+.74),(.12,.15,.23),body,segments=8,rings=5)
                m.strand(foot,[(px,.25,z+.88),(px,.19,z+1.08),(px,.08,z+1.15)],.085,energy,'#fff1c9',segments=5,sides=6,kind='glow' if id=='lightning' else 'metal')
            m.armor(lower,(x,.84,z+.28),(.20,.74),'#484759')
            m.line(lower,[(x-.12,1.06,z+.56),(x+.06,.86,z+.60),(x-.03,.65,z+.57)],.025,energy,'glow')
    # Face: forehead, cheekbones, narrow muzzle, eyelids, dark lips and nose.
    head=m.part('head',(0,4.78,1.85))
    m.ell(head,(0,4.81,1.88),(.59,.51,.82),fur,segments=20,rings=12)
    m.ell(head,(0,4.51,2.54),(.29 if fire else .33,.22,.69),fur,segments=16,rings=8)
    m.ell(head,(0,4.30,2.60),(.31,.12,.66),'#c0bfc3',segments=12,rings=6)
    m.ell(head,(0,4.51,3.25),(.17,.10,.13),'#242936',segments=12,rings=6)
    for k in range(5):
        x=(k-2)*.12
        m.leaf(head,(x*.5,5.34,1.97),(x,4.99,2.50),.095,fur,edge,bend=.04)
    m.rune(head,(0,5.17,2.54),.14,energy)
    for side in (-1,1):
        m.line(head,[(side*.07,4.34,3.19),(side*.27,4.32,2.93),(side*.35,4.39,2.52)],.018,'#343343','fur')
        # Raised almond-shaped sockets with luminous slanted irises.
        p=[(side*.28,4.96,2.56),(side*.55,5.02,2.39),(side*.57,4.91,2.42),(side*.36,4.88,2.58)]
        m.add(head,p,[(0,1,2,3)],'#282736')
        p=[(side*.32,4.947,2.578),(side*.53,4.98,2.438),(side*.49,4.918,2.469),(side*.36,4.904,2.59)]
        m.add(head,p,[(0,1,2,3)],energy,'eyes')
        m.leaf(head,(side*.23,5.08,2.46),(side*.76,5.08,2.03),.12,edge,fur)
        # Swept cheek locks and long pointed, two-tone ears.
        for k in range(7):
            m.leaf(head,(side*(.38+k*.022),4.91-k*.10,2.13),(side*(.93+k*.035),4.76-k*.12,1.59-k*.025),.13,fur,edge)
        ear=[(side*.39,5.15,1.62),(side*.83,5.12,1.52),(side*(.85 if fire else .88),6.10 if fire else 5.91,1.37),(side*.60,5.45,1.72)]
        m.add(head,ear,[(0,1,3),(1,2,3),(2,0,3)],edge)
        m.add(head,[(side*.47,5.27,1.68),(side*.74,5.27,1.60),(side*.80,5.90 if fire else 5.73,1.44)],[(0,1,2)],'#ddd9d7')
        for k in range(4):
            m.leaf(head,(side*.26,5.25-k*.11,1.53),(side*(.84+k*.07),5.48-k*.16,1.00),.16,fur,edge)
    m.armor('torso',(0,3.53,2.01),(.43,1.12),'#6c4c3d' if fire else '#747780')
    m.rune('torso',(0,3.57,2.43),.32,energy)
    # Natural shoulder scales with gold filigree and elemental seals.
    for side in (-1,1):
        for row in range(3):
            for j in range(3):
                x=side*(.78+row*.10);y=3.68-row*.26;z=.97-j*.32
                m.leaf('torso',(x,y+.20,z),(x+side*.31,y-.25,z-.18),.26,'#99663e' if fire else '#777786',kind='metal')
        m.rune('torso',(side*1.43,3.35,.64),.23,energy,axis='side')
    # A ceremonial cord, bead and tassel under the left shoulder.
    m.line('torso',[(.73,3.75,1.34),(1.05,3.31,1.49),(1.13,2.94,1.51)],.026,'#d8bb82')
    m.ell('torso',(1.13,2.92,1.51),(.12,.14,.12),energy,'glow',10,6)
    for j in range(5):m.strand('torso',[(1.13+(j-2)*.035,2.80,1.51),(1.15+(j-2)*.055,2.35,1.55)],.027,edge,segments=4,sides=4)
    if fire:
        # Nine distinct, broad flame tails arranged in a crown behind the body.
        for k in range(9):
            a=(k-4)*.34;x=math.sin(a);height=6.1+math.cos(a)*1.45
            part=m.part('tail-'+str(k),(0,2.55,-1.8))
            points=[(0,2.5,-1.8),(x*1.9,3.0,-3.0),(x*4.5,height-1.9,-3.9),(x*4.8,height-.60,-3.30),(x*4.2+.20,height,-2.65)]
            m.strand(part,points,.66 if k%2 else .72,'#8f2428','#ec6e2e',depth=.30,segments=18,sides=10,profile='plume')
            # Carved flame veins lie on the forward surface of every tail.
            for j in range(3):
                centers=[]
                for t in (.30,.44,.60,.75,.86,.94):
                    p=curve(points,t);centers.append((p.x+(j-1)*.12*math.sin(t*math.pi),p.y,p.z+.24*math.sin(t*math.pi)**.8+.045))
                m.strand(part,centers,.04,'#ffab35','#ffe6a0',depth=.40,segments=10,sides=5,kind='glow')
            p=curve(points,.59);m.rune(part,(p.x,p.y,p.z+.30),.21,'#ffbb4e')
            for j in range(6):
                p=curve(points,.34+j*.086)
                for hand in (-1,1):m.leaf(part,(p.x+hand*.34,p.y,p.z+.10),(p.x+hand*.64,p.y+.45,p.z+.13),.12,'#b83926','#ffae36',bend=.08)
            for j in range(3):
                p=curve(points,.65+j*.09)
                m.leaf(part,(p.x,p.y,p.z),(p.x+x*.55+.20,p.y+.92,p.z+.10),.21,'#ff9d30','#ffe8a0','glow')
    else:
        tail=m.part('tail-0',(0,2.4,-1.9))
        points=[(0,2.4,-1.9),(.65,2.4,-3.1),(1.65,3.2,-3.8),(2.0,4.25,-3.9),(1.36,4.85,-3.15)]
        m.strand(tail,points,.48,body,fur,segments=16,sides=10,profile='plume')
        for k in range(20):
            t=.15+k*.036;p=curve(points,t)
            m.leaf(tail,tuple(p),(p.x+.27*math.sin(k*2.4),p.y-.35,p.z-.44),.14,fur,edge)
    if neutral:
        for side in (-1,1):
            points=[(side*.43,5.38,1.63),(side*.85,5.90,1.30),(side*1.28,6.43,.91),(side*1.64,6.95,.83),(side*1.34,7.40,.93)]
            m.strand(head,points,.14,'#a59069','#f9dfaa',segments=12,sides=7)
            for k in range(1,4):
                p=Vector(points[k]);m.strand(head,[tuple(p),(p.x+side*.55,p.y+.27,p.z-.17),(p.x+side*.65,p.y+.67,p.z-.12)],.07,'#d8c092','#fff0cb',segments=6,sides=6)
            p=points[2];m.line(head,[p,(p[0],p[1]-.5,p[2])],.018,'#c1a46f')
            m.armor(head,(p[0],p[1]-.70,p[2]),(.105,.34),'#c8aa70')
        for row in range(5):
            for j in range(5):
                x=(j-2)*.29;y=3.62-abs(j-2)*.10;z=.05-row*.39
                m.leaf('torso',(x,y,z),(x,y-.17,z-.58),.22,'#858c9e','#b7b6bd','metal')
        halo=m.part('halo',(0,5.3,-1.5))
        pts=[(math.sin(k*math.tau/64)*2.35,5.25+math.cos(k*math.tau/64)*2.35,-1.55) for k in range(65)]
        m.line(halo,pts,.025,'#e3c18b','glow')
        for k in range(16):
            a=k*math.tau/16;x=math.sin(a)*2.35;y=5.25+math.cos(a)*2.35
            m.line(halo,[(x-.07,y-.1,-1.52),(x+.07,y+.1,-1.52),(x-.07,y+.1,-1.52)],.015,'#f6d8a4','glow')
        for side in (-1,1):
            part=m.part('spirit-ribbon-'+str(side),(0,3,-1.2))
            pts=[(side*.6,3.6,-1.1),(side*2.7,4.0,-2.5),(side*3.3,5.0,-2.9),(side*2.8,5.8,-1.7),(side*2.2,5.25,-1.2)]
            m.strand(part,pts,.18,'#d6d7e5','#f1dcbb',depth=.11,segments=26,sides=5,kind='spirit')
    elif id=='lightning':
        for row in range(6):
            for j in range(5):
                a=(j-2)*.38;x=math.sin(a)*.72;y=5.24-row*.25;z=1.15-row*.18
                m.leaf('torso',(x,y,z),(x*1.65,y+.12,z-.82),.21,'#ded7ec','#7e45d8',bend=.12)
        for side in (-1,1):
            part=m.part('electric-aura-'+str(side),(0,0,0))
            for k in range(3):
                x=side*(1.2+k*.38)
                m.line(part,[(x,2.0,-.3-k*.5),(x+side*.48,2.64,-.8-k*.5),(x+side*.12,2.86,-.9-k*.5),(x+side*.78,3.64,-1.2-k*.5)],.022,'#bb7cff','glow')
    return m

def dragon():
    m=Sculpt('water')
    points=[(2.4,.40,-3.5),(-.5,.64,-3.2),(-2.1,1.6,-2.2),(1.6,2.7,-1.7),(1.7,3.65,-1.1),(-1.05,4.6,-.4),(-1.05,5.55,.45),(0,6.25,1.45)]
    m.flow_path=points
    m.part('spine')
    m.part('serpent-skin',parent='spine')
    m.strand('serpent-skin',points,.69,'#1b65a1','#77c8dc',depth=.9,segments=84,sides=14,profile='dragon',flow=True)
    # Scale rows wrap the serpent's changing tangent. Belly plates are ivory.
    for row in range(62):
        t=.06+row*.0146;p=curve(points,t);d=(curve(points,min(1,t+.01))-curve(points,max(0,t-.01))).normalized()
        right=d.cross(Vector((0,0,1)))
        if right.length<.01:right=d.cross(Vector((0,1,0)))
        right.normalize();front=right.cross(d).normalized();r=.69*(.025+.975*math.sin(t*math.pi*.5))
        for col in range(9):
            a=(col-4)*.54+(row%2)*.22;out=right*math.sin(a)+front*math.cos(a)
            center=p+out*(r*.96)
            m.leaf('spine',tuple(center+d*.15),tuple(center-d*.33),.20,'#3289be' if col%3 else '#82bed1','#a5e3e8',bend=.028,normal=tuple(out))
        b=p+front*(r+.025)
        m.leaf('spine',tuple(b+d*.18),tuple(b-d*.30),.28,'#d4e1df','#f0eee4',bend=.045,normal=tuple(front))
        if row%3==0:
            back=p-front*r
            m.leaf('spine',tuple(back),tuple(back-front*.75+d*.18),.26,'#d1ac6b','#f6dd9c','metal',normal=tuple(right))
    head=m.part('head',(0,6.48,1.65))
    m.ell(head,(0,6.49,1.74),(.73,.68,.92),'#dce6e8',segments=20,rings=12)
    m.ell(head,(0,6.18,2.43),(.36,.24,.72),'#e7e9df',segments=16,rings=9)
    m.ell(head,(0,5.99,2.48),(.39,.105,.74),'#d2d8d4',segments=14,rings=6)
    m.ell(head,(0,6.24,3.21),(.23,.15,.14),'#9db5bd',segments=12,rings=7)
    for side in (-1,1):
        m.line(head,[(side*.1,6.02,3.20),(side*.39,6.01,2.84),(side*.43,6.07,2.43)],.027,'#344e6a','fur')
        m.ell(head,(side*.16,6.32,3.20),(.055,.033,.04),'#3b5f76',segments=8,rings=5)
        m.add(head,[(side*.30,6.66,2.49),(side*.63,6.78,2.18),(side*.59,6.56,2.31),(side*.34,6.52,2.56)],[(0,1,2,3)],'#173457')
        m.add(head,[(side*.34,6.63,2.51),(side*.57,6.71,2.31),(side*.54,6.58,2.37),(side*.36,6.57,2.53)],[(0,1,2,3)],'#6af1ff','eyes')
        m.leaf(head,(side*.25,6.83,2.37),(side*.85,6.92,1.92),.17,'#72bed9','#e1f2ef')
        for k in range(7):
            m.strand(head,[(side*.43,6.85-k*.10,1.42),(side*.82,7.04-k*.12,.87),(side*1.12,7.0-k*.09,.19),(side*1.43,7.23-k*.13,-.40)],.14,'#c7d9e0','#f4f1e6',depth=.3,segments=10,sides=5,profile='plume')
        horn=[(side*.46,6.98,1.41),(side*.67,7.45,1.14),(side*1.04,7.86,.90),(side*1.40,8.24,1.01),(side*1.45,8.55,1.25)]
        m.strand(head,horn,.14,'#b99a61','#f6e5ba',segments=14,sides=7)
        for k in (1,2,3):
            p=horn[k];m.strand(head,[p,(p[0]-side*.30,p[1]+.22,p[2]-.27),(p[0]-side*.32,p[1]+.48,p[2]-.37)],.065,'#d2b77c','#f3dfb2',segments=6,sides=6)
        m.strand(head,[(side*.30,6.14,3.07),(side*1.0,6.0,3.21),(side*1.62,6.20,2.82),(side*1.85,6.68,2.37)],.035,'#e3eeed','#8adce4',depth=1,segments=18,sides=5)
        for k in range(4):m.strand(head,[(side*.10,6.06-k*.03,2.73),(side*.24,5.59-k*.10,2.72),(side*.45,5.20-k*.14,2.20),(side*.72,5.33-k*.17,1.84)],.09,'#dce7e5','#faf1da',depth=.4,segments=8,sides=5,profile='plume')
    m.armor(head,(0,6.94,2.26),(.21,.54),'#c8ac72')
    m.ell(head,(0,6.95,2.42),(.105,.14,.055),'#6ee1fa','glow',12,8)
    # Floating pearls and a gold collar belong to the flowing spine, not wings.
    for side in (-1,1):
        m.line('spine',[(side*.45,5.62,.96),(side*.75,5.13,1.0),(side*.68,4.72,1.12)],.045,'#c8ac74')
        for k in range(4):m.ell('spine',(side*(.68+k*.03),4.92-k*.20,1.16),(.10 if k else .23,.10 if k else .23,.10 if k else .23),'#deebf0','metal',10,7)
        # Small dragon foreclaws emerge from the body; they are not wing bones.
        m.strand('spine',[(side*.45,4.52,.14),(side*1.13,3.97,.60),(side*1.28,3.25,1.10)],.20,'#d8e1dd',segments=9,sides=8)
        for k in range(3):m.strand('spine',[(side*1.28+(k-1)*.14,3.27,1.08),(side*1.34+(k-1)*.19,3.04,1.45),(side*1.40+(k-1)*.18,2.92,1.62)],.07,'#bf9d5b','#f4d9a0',segments=6,sides=6,kind='metal')
    # Detached translucent flow ribbons: explicitly water, with no wing joint.
    for k in range(6):
        side=-1 if k%2 else 1
        pts=[(side*.5,2.0+k*.35,-1.4),(side*(2.0+k*.16),2.8+k*.37,-2.0),(side*(2.5+k*.12),4.0+k*.35,-1.8),(side*(1.75+k*.12),4.8+k*.38,-1.2)]
        m.strand('spine',pts,.29,'#146fba','#83f3ef',depth=.075,segments=20,sides=6,kind='water',profile='plume')
        m.line('spine',[(x,y,z+.025) for x,y,z in pts],.025,'#b1faff','glow')
        for t in (.42,.77):
            p=curve(pts,t);m.ell('spine',(p.x+.16,p.y+.12,p.z+.04),(.065,.08,.065),'#9ef2f4','water',8,5)
    return m

def eagle():
    m=Sculpt('wind');white='#e9ebe2';mint='#87cbb5';green='#347f79'
    m.ell('torso',(0,3.05,-.10),(.83,1.24,.79),white,segments=18,rings=10)
    m.ell('torso',(0,4.10,.30),(.50,.94,.48),white,segments=16,rings=9)
    for row in range(6):
        for col in range(7):
            x=(col-3)*(.17-row*.008);y=4.35-row*.33;z=.53+math.cos((col-3)*.35)*.22
            m.leaf('torso',(x,y,z),(x*1.1,y-.65,z+.10),.14,white,mint if col%3==0 else '#f4f0df',bend=.08)
    head=m.part('head',(0,5.15,.58))
    m.ell(head,(0,5.18,.57),(.48,.52,.64),white,segments=18,rings=10)
    m.strand(head,[(0,5.09,1.03),(0,5.02,1.39),(0,4.80,1.53)],.23,'#c6a365','#f1d6a1',depth=.7,segments=9,sides=9,kind='metal')
    for side in (-1,1):
        m.add(head,[(side*.27,5.31,1.0),(side*.43,5.38,.77),(side*.45,5.22,.80),(side*.31,5.19,1.04)],[(0,1,2,3)],'#243e42')
        m.add(head,[(side*.30,5.29,1.024),(side*.405,5.325,.85),(side*.395,5.24,.88),(side*.32,5.23,1.035)],[(0,1,2,3)],'#7bffe0','eyes')
        m.leaf(head,(side*.15,5.48,.97),(side*.66,5.65,.16),.14,white,mint)
        for k in range(5):m.leaf(head,(side*.17,5.55-k*.08,.50),(side*(.25+k*.18),6.12-k*.06,-.60-k*.10),.16,white,green if k%2 else mint,bend=.2)
        wing=m.part('wing-'+('left' if side>0 else 'right'),(side*.72,3.98,-.28))
        # Wing membrane is covered by three offset rows of individual feathers.
        v=[(side*.65,3.8,-.25),(side*2.7,5.1,-.35),(side*5.0,6.1,-.50),(side*6.15,6.9,-.64),(side*5.55,4.2,-.10),(side*2.1,2.9,.10)]
        m.add(wing,v,[(0,1,5),(1,2,4,5),(2,3,4)],green)
        for j in range(18):
            t=j/17;x=1.1+t*4.25;y=4.20+t*1.91
            end=(side*(x+1.0),y-1.60+t*.40,-.06)
            if j>=14:end=(side*(x+1.25),y+.15+(j-14)*.24,-.20)
            m.leaf(wing,(side*x,y,-.31),end,.27,green,'#b7e5d0',bend=.14)
        for row in range(2):
            for j in range(15):
                t=j/14;x=.91+t*4.45;y=4.16+t*1.92-row*.25
                m.leaf(wing,(side*x,y,-.04+row*.10),(side*(x+.62),y-.93,-.01+row*.13),.26,white,mint if (j+row)%3==0 else '#d8e5d7',bend=.13)
        # A carved shoulder clasp and layered gold-and-ivory feather armor.
        for j in range(3):m.leaf(wing,(side*(.70+j*.18),4.35+j*.12,.22),(side*(1.08+j*.24),3.70+j*.06,.32),.22,'#b8a16b','#e8d1a2','metal')
        for j in range(3):
            m.leaf('torso',(side*.46,3.92-j*.25,.50),(side*.75,3.38-j*.25,.58),.14,'#d0b780','#eee4c6','metal')
        leg=m.part('front-'+('left' if side>0 else 'right'),(side*.47,2.32,.02))
        knee=m.part('front-'+('left' if side>0 else 'right')+'-knee',(side*.57,1.22,.04),leg)
        foot=m.part('front-'+('left' if side>0 else 'right')+'-foot',(side*.62,.3,.13),knee)
        m.strand(leg,[(side*.47,2.3,.02),(side*.61,1.53,.02),(side*.57,1.22,.04)],.25,white,mint,segments=8,sides=9)
        m.strand(knee,[(side*.57,1.26,.04),(side*.62,.40,.13)],.14,'#8c876a','#bcb58f',segments=8,sides=8)
        for j in range(3):m.strand(foot,[(side*.62,.34,.12),(side*.62+(j-1)*.24,.23,.54),(side*.62+(j-1)*.31,.08,.84)],.09,'#ba9d60','#f3dab0',segments=7,sides=7,kind='metal')
        m.strand(foot,[(side*.62,.32,.04),(side*.78,.17,-.33),(side*.83,.09,-.43)],.085,'#ba9d60','#f3dab0',segments=6,sides=6,kind='metal')
    for k in range(7):
        part=m.part('tail-'+str(k),(0,2.52,-.65));x=(k-3)*.24
        pts=[(x*.3,2.8,-.62),(x*.9,1.55,-1.45),(x*1.8,.55,-2.3),(x*2.3,.35,-3.15),(x*2.6,.88,-3.70)]
        m.strand(part,pts,.22,white,mint,depth=.12,segments=15,sides=6,profile='plume')
    m.armor('torso',(0,3.7,.87),(.34,.84),'#d4c393')
    m.rune('torso',(0,3.75,1.03),.25,'#75f0d1')
    return m

if SECOND_SET:
    source=ROOT/'tools'/'sculpt-later-guardians.py'
    exec(compile(source.read_text(encoding='utf-8'),str(source),'exec'))
else:
    MODELS.update({id:canine(id) for id in ('nameless','fire','lightning')})
    MODELS['water']=dragon();MODELS['wind']=eagle()

def packed(values,fmt):
    return base64.b64encode(struct.pack('<'+fmt*len(values),*values)).decode()

material_cache={}
def blender_material(kind):
    if kind in material_cache:return material_cache[kind]
    mat=bpy.data.materials.new('Guardian '+kind);mat.use_nodes=True
    shader=next(n for n in mat.node_tree.nodes if n.type=='BSDF_PRINCIPLED')
    color=mat.node_tree.nodes.new('ShaderNodeVertexColor');color.layer_name='Col'
    mat.node_tree.links.new(color.outputs['Color'],shader.inputs['Base Color'])
    shader.inputs['Roughness'].default_value=.36 if kind=='metal' else .18 if kind in ('water','crystal') else .84
    shader.inputs['Metallic'].default_value=.28 if kind=='metal' else .04
    if kind in ('glow','eyes','water','spirit','crystal'):
        mat.node_tree.links.new(color.outputs['Color'],shader.inputs['Emission Color'])
        shader.inputs['Emission Strength'].default_value=1.6 if kind in ('glow','eyes') else .35
    if kind in ('water','spirit'):
        shader.inputs['Alpha'].default_value=.52 if kind=='water' else .29
        shader.inputs['Transmission Weight'].default_value=.18 if kind=='water' else 0
    mat.diffuse_color=(.6,.65,.7,.5 if kind in ('water','spirit') else 1)
    material_cache[kind]=mat;return mat

exported={};summaries=[];rigs=[]
for index,id in enumerate(MODELS):
    model=MODELS[id];collection=bpy.data.collections.new(id+' guardian');scene.collection.children.link(collection)
    armature=bpy.data.armatures.new(id+' anatomical rig');rig=bpy.data.objects.new(id+' guardian rig',armature);collection.objects.link(rig)
    bpy.context.view_layer.objects.active=rig;rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    for name,part in model.parts.items():
        bone=armature.edit_bones.new(name);bone.head=ZUP(part['pivot']);bone.tail=Vector(bone.head)+Vector((0,0,.28))
    for name,part in model.parts.items():
        if part['parent']:armature.edit_bones[name].parent=armature.edit_bones[part['parent']]
    if id=='water':
        for k in range(13):
            bone=armature.edit_bones.new('flow-'+str(k).zfill(2));p=curve(model.flow_path,k/12)
            bone.head=ZUP(p);bone.tail=ZUP(curve(model.flow_path,(k-1)/12)) if k else Vector(bone.head)+Vector((0,0,.20))
        for k in range(13):armature.edit_bones['flow-'+str(k).zfill(2)].parent=armature.edit_bones['flow-'+str(k+1).zfill(2)] if k<12 else armature.edit_bones['torso']
        armature.edit_bones['head'].parent=armature.edit_bones['flow-12']
    bpy.ops.object.mode_set(mode='OBJECT')
    meshes=[];entries=[];triangles=0
    for (part,kind),data in model.groups.items():
        name='serpentine-dragon' if id=='water' and part=='serpent-skin' else 'fire-tail-'+str(int(part[5:])+1) if id=='fire' and part.startswith('tail-') and kind=='fur' else part+'-'+kind
        mesh=bpy.data.meshes.new(name);mesh.from_pydata([ZUP(p) for p in data['p']],[],[data['i'][k:k+3] for k in range(0,len(data['i']),3)]);mesh.update()
        for poly in mesh.polygons:poly.use_smooth=kind not in ('rock','crystal')
        colors=mesh.color_attributes.new(name='Col',type='FLOAT_COLOR',domain='POINT')
        for k,c in enumerate(data['c']):colors.data[k].color=(*c,1)
        obj=bpy.data.objects.new(name,mesh);collection.objects.link(obj);obj.parent=rig;obj.data.materials.append(blender_material(kind))
        flow=[]
        if id=='water' and part in ('spine','serpent-skin'):
            samples=[curve(model.flow_path,k/84) for k in range(85)]
            for k,p in enumerate(data['p']):
                t=data['flow'][k]
                if t<0:t=min(range(85),key=lambda i:(samples[i]-Vector(p)).length_squared)/84
                flow.append(round(t*255))
            weights=[obj.vertex_groups.new(name='flow-'+str(k).zfill(2)) for k in range(13)]
            for k,value in enumerate(flow):
                t=value/255*12;a=int(t);b=min(12,a+1);blend=t-a
                weights[a].add([k],1-blend,'REPLACE')
                if b!=a and blend:weights[b].add([k],blend,'REPLACE')
        else:
            group=obj.vertex_groups.new(name=part);group.add(list(range(len(data['p']))),1,'REPLACE')
        mod=obj.modifiers.new('Anatomical rig','ARMATURE');mod.object=rig
        obj['guardian_part']=part;obj['material_role']=kind;meshes.append(obj)
        positions=[round(x*2048) for p in data['p'] for x in p]
        normals=[]
        for v in mesh.vertices:
            n=v.normal;normals.extend(round(max(-1,min(1,x))*127) for x in (n.x,n.z,-n.y))
        cols=[round(max(0,min(1,c))*255) for rgb_ in data['c'] for c in rgb_]
        item={'name':name,'part':part,'kind':kind,'p':packed(positions,'h'),'n':packed(normals,'b'),'c':packed(cols,'B'),'i':packed(data['i'],'H')}
        if flow:
            item['flow']=packed(flow,'B')
        entries.append(item);triangles+=len(data['i'])//3
    mouth=getattr(model,'mouth',[0,6.10,3.22] if id=='water' else [0,4.90,1.5] if id=='wind' else [0,4.42,3.25])
    exported[id]={'version':1,'parts':model.parts,'meshes':entries,'head':model.parts['head']['pivot'],'mouth':mouth,'triangles':triangles}
    # Export one independently rigged GLB in metres, at the origin.
    bpy.ops.object.select_all(action='DESELECT');rig.select_set(True)
    for obj in meshes:obj.select_set(True)
    export_enum=bpy.ops.export_scene.gltf.get_rna_type().properties['export_format'].enum_items
    # Blender 5.2's dynamic enum omits its values from RNA; GLB was also
    # verified against the operator's own TypeError list on this version.
    glb=next((i.identifier for i in export_enum if i.identifier=='GLB'),'GLB')
    bpy.ops.export_scene.gltf(filepath=str(OUT/(id+'.glb')),export_format=glb,use_selection=True,use_active_scene=True,export_animations=False)
    rig.location.x=(index-2)*16;rigs.append(rig)
    summaries.append({'id':id,'triangles':triangles,'draws':len(entries),'joints':len(armature.bones),'glbBytes':(OUT/(id+'.glb')).stat().st_size})
(OUT/('later-guardians.json' if SECOND_SET else 'reference-guardians.json')).write_text(json.dumps(exported,separators=(',',':')),encoding='utf-8')
(OUT/('later-report.json' if SECOND_SET else 'report.json')).write_text(json.dumps(summaries,indent=2),encoding='utf-8')
scene.world=bpy.data.worlds.new('Guardian studio');scene.world.use_nodes=True
bg=next(n for n in scene.world.node_tree.nodes if n.type=='BACKGROUND');bg.inputs[0].default_value=(.10,.13,.18,1);bg.inputs[1].default_value=.5
for name,pos,power,size in [('Key',(-18,-15,18),2400,12),('Fill',(18,-8,14),1800,10),('Rim',(0,8,18),3000,12)]:
    data=bpy.data.lights.new('Guardian '+name,'AREA');data.energy=power;data.size=size
    obj=bpy.data.objects.new('Guardian '+name,data);scene.collection.objects.link(obj);obj.location=pos;obj.rotation_euler=(Vector((0,0,3))-obj.location).to_track_quat('-Z','Y').to_euler()
data=bpy.data.cameras.new('Guardian review');camera=bpy.data.objects.new('Guardian review',data);scene.collection.objects.link(camera)
camera.location=(10,-22,12);camera.rotation_euler=(Vector((0,0,4))-camera.location).to_track_quat('-Z','Y').to_euler();data.lens=54;scene.camera=camera
scene.render.resolution_x=1200;scene.render.resolution_y=1100;scene.render.resolution_percentage=100
if SECOND_SET:
    scene.timeline_markers.clear()
    for index,rig in enumerate(rigs):
        offset=rig.location.x
        marker=scene.timeline_markers.new(rig.name.split()[0],frame=1+index*30)
        review=camera.copy();review.data=camera.data.copy();scene.collection.objects.link(review)
        review.name=rig.name.split()[0]+' study';review.location=(offset+13,-19,10)
        review.rotation_euler=(Vector((offset,0,3.4))-review.location).to_track_quat('-Z','Y').to_euler()
        review.data.type='ORTHO';review.data.ortho_scale=12 if index!=3 else 14
        marker.camera=review
    scene.frame_set(1)
    bpy.data.libraries.write(str(OUT/'last-five-guardians.blend'),{scene},fake_user=True,compress=True)
else:
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'first-five-guardians.blend'))
print(json.dumps(summaries))
