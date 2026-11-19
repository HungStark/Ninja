"""Maple reference-sheet layers, executed by build-hero-reference.py.

All vertices use the original humanoid bind space. This adds clothing and
equipment; face topology, eyelids, finger joints and bind matrices stay intact.
"""
texture_path = ROOT/'tools/hero-maple-textures.py'
texture_builder = {}
exec(compile(texture_path.read_text(encoding='utf-8'), str(texture_path), 'exec'), texture_builder)
texture_builder['maple_maps'](asset, materials)

COLORS.update(cloth='#302d34', edge='#494149', red='#91383c', steel='#54545e',
              metal='#c3a37c', leather='#5a4039', lining='#23232c', stitch='#a9826a')

# Short sleeves expose the upper forearms as in the sheet. Original skin
# remains beneath them; the fitted outer skin supplies a clean sleeve edge.
upper_arm_joints = {joint('L_UpperArm'),joint('R_UpperArm')}
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
        fitted = []
        for (x,y,z), joints, weights in zip(attrs['POSITION'],attrs['JOINTS_0'],attrs['WEIGHTS_0']):
            # In bind space the raised arms turn downward in the idle pose.
            # Broaden the torso in X and the upper sleeve across its radial axis.
            shoulder = .014*max(0,min(1,(abs(x)-.095)/.085))*max(0,min(1,(y-1.24)/.12))
            shoulder *= max(0,min(1,(.355-abs(x))/.085))
            arm = sum(weight for j,weight in zip(joints,weights) if j in upper_arm_joints)
            fitted.append((max(-.35,min(.35,x+math.copysign(shoulder*(1-arm),x))),
                           y+shoulder*arm*max(0,min(1,(y-1.34)/.085)),z))
        attrs['POSITION'] = fitted
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
    geometry('MapleArms',v,f,'#c6a084',arm_weights,smooth=True,material='skin')
for side in (-1,1):
    v=[];n=16
    for x in (.339,.357):
        for i in range(n+1):
            a=i*math.tau/n
            v.append((side*x,1.419+math.cos(a)*.081,-.027+math.sin(a)*.078))
    geometry('MapleSleeves',v,[(i,i+1,i+n+1) for i in range(n)]+[(i+1,i+n+2,i+n+1) for i in range(n)],'edge',('L' if side>0 else 'R')+'_UpperArm',smooth=True)

# Burgundy scarf wraps sit between mask and tunic. Folds remain visible at the
# neck even when the player equips a village breastplate.
for k, color in enumerate(('#652932', '#913e43')):
    v, uv = [], []
    for row, t in enumerate((0,.16,.37,.64,.86,1)):
        for i in range(33):
            a = math.pi+i*math.tau/32
            r = .119 + .013*(1-t) + .013*math.sin(t*math.pi) - k*.004
            r += .003 * math.sin(a*3+.9+k) * math.sin(t*math.pi)
            v.append((math.sin(a)*r,1.432+k*.047+t*.065 +
                      math.sin(a+.15+k*.69)*(.021-k*.005)-.010*math.cos(a),
                      -.012+math.cos(a)*(r*.92)))
            uv.append((i/16,row/2))
    f = []
    for row in range(5):
        for i in range(32):
            a = row*33+i
            f.extend(((a,a+1,a+33),(a+1,a+34,a+33)))
    geometry('Collar',v,f,color,smooth=True,material='woven',uv=uv)

# Contour the face wrap over the bridge and around the cheekbones.
v, uv = [], []
for j, (y, rx, rz) in enumerate([(1.529,.076,.079),(1.545,.086,.091),
                                 (1.572,.093,.093),(1.588,.095,.096)]):
    for i in range(29):
        u = i/28
        a = (u-.5)*4.5
        bridge = math.exp(-14*a*a)
        side = abs(math.sin(a))
        v.append((math.sin(a)*rx,y+(j/3)*(.013*bridge-.006*side),
                  .006+rz*math.cos(a)+.004*bridge))
        uv.append((3*u,j/3))
geometry('Mask',v,[(j*29+i,j*29+i+1,(j+1)*29+i) for j in range(3) for i in range(28)]+
         [(j*29+i+1,(j+1)*29+i+1,(j+1)*29+i) for j in range(3) for i in range(28)],
         '#26252d','C_Head',smooth=True,material='woven',uv=uv)

# One broad leather cross-body strap, with raised stitching and a metal clasp.
strap=[(.139,1.401,.125),(.095,1.32,.154),(.022,1.23,.166),(-.065,1.123,.166),(-.129,1.059,.148)]
ribbon('Harness',strap,.042,'leather')
for sign in (-1,1):
    ribbon('Harness',[(x+sign*.012,y,z+.0015) for x,y,z in strap],.002,'stitch')
buckle('Harness',.057,1.274,.175,.035,.026,rotate=-.65)
ribbon('Harness',[(-.146,1.405,.123),(-.092,1.322,.154),(-.027,1.239,.169),
                  (.077,1.145,.166),(.147,1.065,.141)],.032,'#763339')
ribbon('Harness',[(-.136,1.403,.125),(-.082,1.322,.157),(-.019,1.239,.172),
                  (.088,1.145,.167),(.157,1.065,.144)],.002,'stitch')

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
        geometry('HipPanels',v,f,'cloth',panel_weights(side),smooth=True,
                 material='woven',uv=[(col*.5,row*.5) for row in range(4) for col in range(3)])
        ribbon('HipPanels',[v[i] for i in (2,5,8,11)],.006,'edge',panel_weights(side))
        ribbon('HipPanels',[v[i] for i in (0,3,6,9)],.004,'lining',panel_weights(side))

# Braided red cord, knot and tassels at the waist.
for k in range(2):
    tube('Belt',[(0,1.071+k*.016,0,.179,.153),(0,1.081+k*.016,0,.18,.154)],'red','C_Hips',28)
for side in (-1,1):
    ribbon('Belt',[(.078,1.08,.169),(.078+side*.038,1.096,.175),(.078+side*.065,1.073,.177),(.078+side*.035,1.057,.177),(.078,1.08,.169)],.009,'red','C_Hips')
    ribbon('Belt',[(.078+side*.016,1.067,.178),(.095+side*.022,.993,.182),(.092+side*.028,.905,.181)],.009,'red','C_Hips')
    box('Belt',(.092+side*.028,.897,.183),(.018,.045,.012),'red','C_Hips',rotate=side*.08)

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


def grid_faces(height, width, reverse=False):
    faces = []
    for row in range(height-1):
        for col in range(width-1):
            a = row*width+col
            b = a+width
            faces.extend(((a,a+1,b),(a+1,b+1,b)))
    return [face[::-1] for face in faces] if reverse else faces


# A tied crown with curved locks that carry the hair silhouette into profile.
for i in range(7):
    a = i*math.tau/7
    offset = math.sin(a)*.031
    layer = math.cos(a)*.016
    lock([(offset,1.774+layer,-.075,.022,.024),
          (offset-.012,1.835+layer,-.106,.024,.023),
          (offset-.027,1.876+layer,-.155,.029,.024),
          (offset-.057,1.858+layer,-.213,.028,.021),
          (offset-.091,1.792+layer,-.255,.019,.015),
          (offset-.126,1.741+layer-(i%3)*.019,-.276+layer,.0007,.0007)],
         ('#29262b','#373139','#201f25')[i%3],curved=True)
for y,d in ((1.826,.006),(1.839,.006)):
    tube('PonytailTie',[(-.012,y,-.105,.044,.038),(-.012,y+d,-.107,.044,.038)],
         'red','C_Head',20)
for side in (-1,1):
    ribbon('PonytailTie',[(-.034,1.829,-.124),(-.067+side*.016,1.8,-.225),
                          (-.103+side*.022,1.737,-.299),(-.114+side*.027,1.713,-.325)],
           .011,'#872f33','C_Head')

# The cape hangs from the scarf and sweeps to one side as the hips turn.
def cape_weights(p):
    hips = max(0,min(1,(1.42-p[1])/.38))
    return ((joint('C_Chest'),joint('C_Hips'),0,0),(1-hips,hips,0,0))


v, uv = [], []
cape_profile = [(0,1.493,-.113,.128),(-.012,1.43,-.171,.193),
                (-.034,1.33,-.203,.228),(-.052,1.20,-.236,.278),
                (-.074,1.05,-.280,.312),(-.096,.88,-.332,.352),
                (-.109,.68,-.373,.388),(-.127,.49,-.416,.405)]
torn = (.034,-.029,-.079,.020,-.076,.039,.103,-.030,-.077,.006,-.118,-.056,.025)
for row,(x,y,z,width) in enumerate(cape_profile):
    t = row/(len(cape_profile)-1)
    for j, notch in enumerate(torn):
        u = j/(len(torn)-1)
        billow = math.sin(u*math.tau*2.4+t*2.8) * (.007+.025*t)
        v.append((x+width*(u-.5),y+t*(u-.5)*.11+notch*t**12,
                  z+.075*(u-.5)**2+billow))
        uv.append((u,t))
geometry('MapleCape',v,grid_faces(len(cape_profile),len(torn)),
         '#ffffff',cape_weights,smooth=True,material='maple',uv=uv)


def curved_plate(label, side, rows, color, bone, trim=True):
    """Lay a set of overlapping forged ridges around the upper arm/rest axis."""
    v, uv = [], []
    count = 11
    for row, (x, radius, sweep, peak) in enumerate(rows):
        for j in range(count):
            a = -sweep + 2*sweep*j/(count-1)
            v.append((side*(x+peak*math.cos(a)),
                      1.419+radius*math.cos(a),
                      -.027+radius*math.sin(a)*.96))
            uv.append((j/(count-1),row/(len(rows)-1)))
    geometry(label,v,grid_faces(len(rows),count,side<0),color,bone,
             smooth=True,material='forged',uv=uv)
    if trim:
        boundary = list(range(count)) + [i*count+count-1 for i in range(1,len(rows))]
        boundary += list(range(len(v)-2,len(v)-count-1,-1))
        boundary += [i*count for i in range(len(rows)-2,-1,-1)]
        rim = []
        for i in boundary:
            row,col = divmod(i,count)
            edge = Vector(v[i])
            inset = edge.copy()
            if row == 0 or row == len(rows)-1:
                inset += (Vector(v[i+(count if row==0 else -count)])-edge)*.13
            if col == 0 or col == count-1:
                inset += (Vector(v[i+(1 if col==0 else -1)])-edge)*.17
            offset = Vector((0,edge.y-1.419,edge.z+.027)).normalized()*.0016
            rim.extend((edge+offset,inset+offset))
        geometry(label,rim,grid_faces(len(boundary),2),'metal',bone,metal=True,smooth=True)


for side in (-1,1):
    prefix = 'L' if side > 0 else 'R'
    upper, lower, leg = prefix+'_UpperArm', prefix+'_LowerArm', prefix+'_LowerLeg'
    for k in range(2,-1,-1):
        x = .167+k*.052
        r = (.161 if side>0 else .148)-k*.017
        curved_plate('MapleShoulder',side,[(x,r-.041,1.05,-.006),
                     (x+.024,r-.010,1.36,0),(x+.051,r,1.52,.012),
                     (x+.084,r-.018,1.62,.023)],'steel',upper)

    curved_plate('MapleBracer',side,[(.466,.062,1.01,-.012),(.499,.083,1.35,.00),
                 (.551,.071,1.08,.006),(.590,.059,1.27,.004),(.605,.055,.85,.008)],
                 '#49474f',lower)
    for x,r in ((.499,.083),(.551,.071),(.591,.059)):
        for a in (-.86,.86):
            box('MapleBracer',(side*x,1.419+r*math.cos(a),-.027+r*math.sin(a)*.96),
                (.010,.007,.008),'metal',lower,True,bevel=.002)
    x = point(prefix+'_Foot').x
    outline = [(x-.057,.440,.080),(x,.464,.095),(x+.057,.440,.080),
               (x+.047,.296,.077),(x+.036,.183,.080),(x,.142,.091),
               (x-.036,.183,.080),(x-.047,.296,.077)]
    verts = outline+[(x,.298,.118)]
    uv = [((px-x)/.13+.5,(y-.14)/.33) for px,y,z in verts]
    geometry('MapleGreaves',verts,[(k,(k+1)%8,8) for k in range(8)],'#4b4954',leg,
             material='forged',uv=uv)
    for a,b in zip(outline,outline[1:]+outline[:1]):
        ribbon('MapleGreaves',[(a[0],a[1],a[2]+.001),(b[0],b[1],b[2]+.001)],
               .0045,'metal',leg,True)
    for flip in (-1,1):
        ribbon('MapleGreaves',[(x+flip*.039,.424,.089),(x+flip*.018,.385,.111),
               (x+flip*.028,.352,.104),(x,.318,.119)],.006,'metal',leg,True)
    buckle('MapleGreaves',x,.207,.097,.029,.021,leg)
    tube('Boots',[(x,.034,.034,.0655,.122),(x,.038,.034,.0655,.122)],'leather_light',prefix+'_Foot',24)

# The ridge of a stylized beast sits on the larger pauldron.
def crest_point(x, a, r):
    radius = r+.010
    return (x,1.419+math.cos(a)*radius,-.027+math.sin(a)*radius*.96)


crest = [(.189,.49,.128),(.207,.92,.163),(.182,.91,.153),(.195,1.14,.159),
         (.235,1.23,.172),(.254,1.57,.156),(.274,1.67,.144),(.287,1.62,.143),
         (.276,1.30,.161),(.306,1.32,.143),(.302,.98,.150),(.262,.96,.164)]
v = [crest_point(*p) for p in crest+[(.246,1.17,.185)]]
count = len(crest)
geometry('MapleShoulder',v,[(i,(i+1)%count,count) for i in range(count)],'#896b52',
         'L_UpperArm',material='forged',uv=[(x*5,y/.25) for x,y,z in v])
for i in (0,2,3,4,5,6,8,10,11):
    rod('MapleShoulder',v[i],v[(i+1)%count],.003,'metal','L_UpperArm',True,6)
rod('MapleShoulder',crest_point(.232,1.18,.182),crest_point(.241,1.29,.177),
    .0038,'#f68a59','L_UpperArm',True)
rod('MapleShoulder',crest_point(.266,1.53,.158),crest_point(.279,1.58,.151),
    .0026,'#342a2a','L_UpperArm',True)

# Radial clasp and white fox mask at the utility belt.
for i in range(8):
    a = math.tau*i/8
    rod('Harness',(.031,1.223,.18),(.031+math.cos(a)*.022,1.223+math.sin(a)*.022,.192),
        .0028,'metal',metal=True,sides=6)
diamond('Harness',.031,1.223,.192,.019,.023)

def fox_point(x,y,z):
    return (.137+x*.94+y*.26, .991-x*.29+y*.94, .147-x*.30+z)


fox = [(-.052,.051,0),(-.046,.103,-.003),(-.021,.066,.014),
       (0,.068,.020),(.023,.066,.014),(.044,.102,-.003),(.052,.047,0),
       (.042,.004,.015),(.020,-.023,.023),(0,-.032,.031),
       (-.021,-.023,.023),(-.043,.004,.015),(0,.020,.040)]
geometry('FoxCharm',[fox_point(*p) for p in fox],
         [(i,(i+1)%12,12) for i in range(12)],'#e7d9cb','C_Hips',smooth=True)
for side in (-1,1):
    eye = [(side*.012,.024,.041),(side*.022,.028,.038),(side*.043,.041,.018),
           (side*.026,.021,.034)]
    geometry('FoxCharm',[fox_point(*p) for p in eye],
             [(0,1,2),(0,2,3)],'#3e282e','C_Hips')
    for path in [[(.032,.064,.018),(.042,.088,.008),(.044,.056,.011)],
                 [(.010,.044,.039),(.018,.047,.036),(.025,.060,.030)],
                 [(.024,.004,.038),(.038,.01,.030),(.044,.018,.023)]]:
        ribbon('FoxCharm',[fox_point(side*x,y,z) for x,y,z in path],.0048,'red','C_Hips')
box('FoxCharm',fox_point(0,-.023,.038),(.015,.009,.006),'black','C_Hips',bevel=.003)
for side in (-1,1):
    x = side*.04
    rod('FoxCharm',fox_point(x,.001,.013),fox_point(x,-.049,.014),
        .003,'metal','C_Hips',True,6)
    for strand in (-1,0,1):
        rod('FoxCharm',fox_point(x+strand*.004,-.045,.014),
            fox_point(x-.007+strand*.007,-.081,.020),.0032,'red','C_Hips',sides=5)
