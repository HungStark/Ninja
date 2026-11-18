"""Kage reference-sheet layers, executed by build-hero-reference.py.

All vertices use the original humanoid bind space. This adds clothing and
equipment; face topology, eyelids, finger joints and bind matrices stay intact.
"""
for key in list(groups):
    if key[0] in ('Collar', 'Mantle', 'Harness', 'HipPanels'):
        del groups[key]
COLORS.update(cloth='#303039', edge='#48454f', red='#71333e', steel='#696d79',
              metal='#beb4a2', leather='#51443e', lining='#23232c', stitch='#96908b')

# A pointed cloth hood, open around the eyes and mask, with a folded rim.
count, rows = 28, 8
def hood_point(theta, fraction, expand=0):
    edge = .95 + 1.79 * (1-math.cos(theta))*.5
    phi = edge * fraction
    crease = .004 * math.sin(theta*5) * math.sin(phi)**2
    return ((.165+expand+crease)*math.sin(phi)*math.sin(theta),
            1.65+.205*math.cos(phi),
            -.031+(.157+expand+crease)*math.sin(phi)*math.cos(theta))
v=[(0,1.855,-.031)]
for row in range(1,rows+1):
    v.extend(hood_point(i*math.tau/count,row/rows) for i in range(count))
f=[(0,1+(i+1)%count,1+i) for i in range(count)]
for row in range(rows-1):
    for i in range(count):
        a=1+row*count+i;b=1+row*count+(i+1)%count
        f.extend([(a,b,a+count),(b,b+count,a+count)])
geometry('Hood',v,f,'cloth','C_Head',smooth=True)
v=[hood_point(i*math.tau/count,r,.0035) for r in (.962,1) for i in range(count+1)]
geometry('Hood',v,[(i,i+1,i+count+1) for i in range(count)]+[(i+1,i+count+2,i+count+1) for i in range(count)],'edge','C_Head',smooth=True)
for theta in (.9,2.25,3.8,5.2):
    ribbon('Hood',[hood_point(theta,t,.004) for t in (.25,.4,.56,.73,.9,1)],.0022,'edge','C_Head')

# Short sleeves expose the upper forearms as in the sheet. Original skin
# remains beneath them; the fitted outer skin supplies a clean sleeve edge.
for mesh in g['meshes']:
    for primitive in mesh['primitives']:
        if 'tops' not in g['materials'][primitive['material']].get('name','').lower():
            continue
        attrs={key:asset.read(index) for key,index in primitive['attributes'].items()}
        indices=[row[0] for row in asset.read(primitive['indices'])]
        keep=[]
        for i in range(0,len(indices),3):
            tri=indices[i:i+3]
            if all(abs(attrs['POSITION'][j][0])>.35 for j in tri):
                continue
            keep.extend(tri)
        attrs['POSITION']=[(max(-.35,min(.35,x)),y,z) for x,y,z in attrs['POSITION']]
        asset.replace(primitive,attrs,keep)
materials['skin']=len(g['materials'])
g['materials'].append(dict(name='Hero Reference skin',doubleSided=True,pbrMetallicRoughness=dict(baseColorFactor=[1,1,1,1],roughnessFactor=.68,metallicFactor=0)))
for side in (-1,1):
    v=[];n=12
    for x,r in [(.338,.063),(.382,.065),(.435,.059),(.489,.054)]:
        for i in range(n+1):
            a=i*math.tau/n
            v.append((side*x,1.419+math.cos(a)*r,-.027+math.sin(a)*r*.9))
    f=[]
    for row in range(3):
        for i in range(n):
            a=row*(n+1)+i;b=a+n+1;f.extend([(a,a+1,b),(a+1,b+1,b)])
    def arm_weights(p):
        t=max(0,min(1,(abs(p[0])-.42)/.06))
        prefix='L' if side>0 else 'R'
        return ((joint(prefix+'_UpperArm'),joint(prefix+'_LowerArm'),0,0),(1-t,t,0,0))
    geometry('KageArms',v,f,'#cda589',arm_weights,smooth=True)
groups[('KageArms','skin')]=groups.pop(('KageArms','fabric'))
for side in (-1,1):
    v=[];n=16
    for x in (.339,.357):
        for i in range(n+1):
            a=i*math.tau/n
            v.append((side*x,1.419+math.cos(a)*.081,-.027+math.sin(a)*.078))
    geometry('KageSleeves',v,[(i,i+1,i+n+1) for i in range(n)]+[(i+1,i+n+2,i+n+1) for i in range(n)],'edge',('L' if side>0 else 'R')+'_UpperArm',smooth=True)

# Burgundy scarf wraps sit between hood and tunic. Folds remain visible at the
# neck even when the player equips a village breastplate.
for k in range(3):
    tube('Collar',[(0,1.455+k*.022,-.014,.139-k*.004,.122-k*.003),
                   (0,1.481+k*.022,-.014,.137-k*.004,.12-k*.003)],'red','C_Chest',24)
for side in (-1,1):
    v=[(side*.07,1.49,.107),(side*.16,1.455,.08),(side*.235,1.402,.025),
       (side*.22,1.365,-.018),(side*.12,1.42,.09),(side*.045,1.456,.121)]
    geometry('Mantle',v,[(0,1,5),(1,4,5),(1,2,4),(2,3,4)],'red','C_Chest',smooth=True)
    ribbon('Mantle',[v[5],v[4],v[3]],.004,'seam')

# One broad leather cross-body strap, with raised stitching and a metal clasp.
strap=[(.139,1.401,.125),(.095,1.32,.154),(.022,1.23,.166),(-.065,1.123,.166),(-.129,1.059,.148)]
ribbon('Harness',strap,.042,'leather')
for sign in (-1,1):
    ribbon('Harness',[(x+sign*.012,y,z+.0015) for x,y,z in strap],.002,'stitch')
buckle('Harness',.057,1.274,.175,.035,.026,rotate=-.65)

# Split, long coat panels blend gently from the hips into the upper legs.
def panel_weights(side):
    def weights(p):
        amount=max(0,min(.68,(1.02-p[1])/.62))
        return ((joint('C_Hips'),joint(('L' if side>0 else 'R')+'_UpperLeg'),0,0),(1-amount,amount,0,0))
    return weights
for side in (-1,1):
    for back in (False,True):
        sign=-1 if back else 1
        v=[]
        for row,(y,inner,outer,z) in enumerate([(1.045,.035,.174,.135),(.86,.065,.196,.146),(.69,.089,.222,.159),(.52,.131,.227,.165)]):
            v.extend([(side*inner,y,sign*z),(side*(inner+outer)/2,y+.012,sign*(z+.011)),(side*outer,y-.018,sign*(z-.028))])
        f=[]
        for row in range(3):
            for k in range(2):
                a=row*3+k;b=a+3
                f.extend([(a,a+1,b),(a+1,b+1,b)])
        geometry('HipPanels',v,f,'cloth',panel_weights(side),smooth=True)
        ribbon('HipPanels',[v[i] for i in (2,5,8,11)],.006,'edge',panel_weights(side))
        ribbon('HipPanels',[v[i] for i in (0,3,6,9)],.004,'lining',panel_weights(side))

# Braided red cord, knot and tassels at the waist.
for k in range(2):
    tube('Belt',[(0,1.071+k*.016,0,.179,.153),(0,1.081+k*.016,0,.18,.154)],'red','C_Hips',28)
for side in (-1,1):
    ribbon('Belt',[(.078,1.08,.169),(.078+side*.038,1.096,.175),(.078+side*.065,1.073,.177),(.078+side*.035,1.057,.177),(.078,1.08,.169)],.009,'red','C_Hips')
    ribbon('Belt',[(.078+side*.016,1.067,.178),(.095+side*.022,.993,.182),(.092+side*.028,.905,.181)],.009,'red','C_Hips')
    box('Belt',(.092+side*.028,.897,.183),(.018,.045,.012),'red','C_Hips',rotate=side*.08)

# A long, separate back sash. Its flutter morph is applied at runtime.
v=[]
for row,(x,y,z) in enumerate([(.04,1.073,-.169),(.048,.93,-.18),(.068,.77,-.202),(.054,.58,-.219),(.086,.44,-.225)]):
    width=[.105,.11,.108,.1,.075][row]
    v.extend([(x-width/2,y,z),(x,y+.006,z-.012),(x+width/2,y-(.027 if row==4 else .004),z)])
f=[]
for row in range(4):
    for k in range(2):
        a=row*3+k;b=a+3;f.extend([(a,b,a+1),(a+1,b,b+1)])
geometry('KageSash',v,f,'red','C_Hips',smooth=True)

def swirl(label,cx,cy,cz,size,bone):
    for arm in range(3):
        points=[]
        for i in range(13):
            t=i/12;angle=arm*math.tau/3+t*math.pi*1.25;r=size*(.12+.82*t)
            points.append((cx+math.sin(angle)*r,cy+math.cos(angle)*r,cz))
        ribbon(label,points,size*.14,'stitch',bone)
swirl('KageSash',.067,.586,-.239,.038,'C_Hips')
swirl('Harness',0,1.295,-.151,.058,'C_Chest')

# Equipment is constructed in the original T-pose; the arm bones carry it
# into the standing, sprinting and hand-sign poses without runtime re-fitting.
def arm_plate(label,side,x0,x1,radius,bone):
    v=[];segments=8
    for x in (x0,x1):
        for i in range(segments+1):
            a=-1.22+i*2.44/segments
            v.append((side*x,1.419+math.cos(a)*radius,-.027+math.sin(a)*radius*.94))
    f=[]
    for i in range(segments):f.extend([(i,i+1,i+segments+1),(i+1,i+segments+2,i+segments+1)])
    geometry(label,v,f,'steel',bone,True,smooth=True)
    for x in (x0,x1):
        points=[]
        for i in range(segments+1):
            a=-1.22+i*2.44/segments
            points.append((side*x,1.419+math.cos(a)*(radius+.002),-.027+math.sin(a)*(radius+.002)*.94))
        # Rims use explicit strips, rather than one object per rivet.
        for a,b in zip(points,points[1:]):
            geometry(label,[(a[0]-.002,a[1],a[2]),(a[0]+.002,a[1],a[2]),(b[0]-.002,b[1],b[2]),(b[0]+.002,b[1],b[2])],[(0,1,2),(1,3,2)],'metal',bone,True)
for k in range(3):
    arm_plate('KageShoulder',1,.218+k*.052,.286+k*.052,.128-k*.012,'L_UpperArm')
for side in (-1,1):
    arm_plate('KageArm',side,.492,.592,.077,('L' if side>0 else 'R')+'_LowerArm')
    leg=('L' if side>0 else 'R')+'_LowerLeg';x=point(('L' if side>0 else 'R')+'_Foot').x
    outline=[(x-.055,.485,.067),(x+.055,.485,.067),(x+.046,.23,.08),(x,.15,.09),(x-.046,.23,.08)]
    verts=outline+[(x,.34,.103)]
    geometry('KageGreaves',verts,[(k,(k+1)%5,5) for k in range(5)],'steel',leg,True)
    for a,b in zip(outline,outline[1:]+outline[:1]):ribbon('KageGreaves',[a,b],.004,'metal',leg,True)
    for y in (.235,.45):buckle('KageGreaves',x+.041,y,.093,.024,.018,leg)

# A sheathed katana, angled across the back, with a wrapped handle and guard.
def rod(label,a,b,r,color,bone='C_Chest',metal=False,sides=8):
    a,b=Vector(a),Vector(b);axis=(b-a).normalized();q=Vector((0,1,0)).rotation_difference(axis)
    v=[]
    for p in (a,b):
        for j in range(sides):
            angle=j*math.tau/sides
            v.append(tuple(p+q@Vector((math.sin(angle)*r,0,math.cos(angle)*r*.73))))
    f=[]
    for j in range(sides):
        k=(j+1)%sides;f.extend([(j,k,j+sides),(k,k+sides,j+sides)])
    for j in range(1,sides-1):f.extend([(0,j+1,j),(sides,sides+j,sides+j+1)])
    geometry(label,v,f,color,bone,metal,smooth=True)
base=Vector((-.215,.64,-.211));guard=Vector((.205,1.449,-.211));tip=Vector((.292,1.619,-.211));axis=(tip-guard).normalized()
rod('Katana',base,guard,.020,'lining')
rod('Katana',guard,tip,.018,'black')
box('Katana',tuple(guard),(.09,.015,.055),'metal',metal=True,rotate=-.48)
rod('Katana',tuple(tip-axis*.006),tuple(tip+axis*.009),.021,'steel',metal=True)
for k in range(8):
    p=guard.lerp(tip,(k+.5)/8)
    box('Katana',tuple(p+Vector((0,0,-.016))),(.022,.008,.003),'leather_light',rotate=(-.85 if k%2 else .15),bevel=.0005)
for t in (.18,.69):
    p=base.lerp(guard,t)
    rod('Katana',tuple(p-axis*.009),tuple(p+axis*.009),.023,'red')
