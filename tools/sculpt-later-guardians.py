"""Model studies for the second guardian set, loaded by build-reference-guardians.py."""

def leg(model, side, front, hip, knee, ankle):
    name=('front' if front else 'back')+('-left' if side>0 else '-right')
    top=model.part(name,hip)
    shin=model.part(name+'-knee',knee,top)
    paw=model.part(name+'-foot',ankle,shin)
    return top,shin,paw


def shard(model, part, base, tip, width, palette, kind='crystal', sides=6):
    """Faceted stone and minerals with actual planar normals and shaded cuts."""
    a,b=Vector(base),Vector(tip)
    axis=(b-a).normalized()
    u=axis.cross(Vector((0,0,1)))
    if u.length<.05:u=axis.cross(Vector((1,0,0)))
    u.normalize();v=axis.cross(u)
    rings=[]
    for along,r in ((0,.7),(.48,1),(.78,.72)):
        rings.append([a.lerp(b,along)+width*r*(u*math.cos(j*math.tau/sides)+v*math.sin(j*math.tau/sides)) for j in range(sides)])
    for j in range(sides):
        k=(j+1)%sides
        for row in range(2):
            model.add(part,[rings[row][j],rings[row][k],rings[row+1][k],rings[row+1][j]],[(0,1,2,3)],palette[(j+row)%len(palette)],kind)
        model.add(part,[rings[2][j],rings[2][k],b],[(0,1,2)],palette[(j+1)%len(palette)],kind)
    model.add(part,list(reversed(rings[0])),[tuple(range(sides))],palette[0],kind)


def crest(model, part, center, radius, color, pattern='sun', side=False):
    x,y,z=center
    def point(a,r):
        return (x if side else x+math.sin(a)*r,y+math.cos(a)*r,z+math.sin(a)*r if side else z)
    if pattern=='snow':
        for j in range(6):
            angle=j*math.tau/6
            model.line(part,[center,point(angle,radius)],.018,color,'glow')
            for hand in (-1,1):model.line(part,[point(angle,radius*.59),point(angle+hand*.25,radius*.85)],.014,color,'glow')
    elif pattern=='leaf':
        for hand in (-1,1):
            model.line(part,[point(0,radius),point(hand*.84,radius*.72),point(hand*1.62,radius*.55),point(math.pi,radius)],.022,color,'glow')
        model.line(part,[point(math.pi,radius),point(0,radius*.65)],.018,color,'glow')
    elif pattern=='earth':
        model.line(part,[point(j*math.pi/2,radius) for j in range(5)],.024,color,'glow')
        model.line(part,[point(j*math.pi/2,radius*(.69-j*.095)) for j in range(6)],.018,color,'glow')
    else:
        model.line(part,[point(j*math.tau/28,radius*.55) for j in range(29)],.022,color,'glow')
        for j in range(8):
            angle=j*math.tau/8
            model.line(part,[point(angle,radius*.62),point(angle,radius)],.02,color,'glow')


def tree_on_shell(model,x,y,z,height):
    part='torso';bark='#6b4c32'
    model.strand(part,[(x,y,z),(x+.12,y+height*.43,z+.05),(x-.12,y+height,z)],height*.12,bark,segments=7)
    for j in range(5):
        a=j*2.399;dx=math.cos(a)*height*.66;dz=math.sin(a)*height*.66
        end=(x+dx,y+height*(.73+j*.035),z+dz)
        model.strand(part,[(x,y+height*.40,z),(x+dx*.52,y+height*.64,z+dz*.52),end],height*.068,bark,segments=6)
        for k in range(3):
            model.ell(part,(end[0]+math.cos(k*2.4)*.23,end[1]+.08,end[2]+math.sin(k*2.4)*.25),(.36,.13,.28),('#aa923c','#807b38','#c2a34b')[k],segments=7,rings=4)


def mountain_turtle():
    m=Sculpt('earth');skin='#91816d';ochre='#ffc065';stone=('#736353','#9e8363','#c09565','#51493f')
    m.ell('torso',(0,2.09,-.43),(2.27,1.38,2.71),skin,segments=20,rings=10)
    m.ell('torso',(0,1.89,-.43),(2.25,1.02,2.64),'#594330')
    m.ell('torso',(0,2.65,-.45),(2.52,1.49,2.84),'#57483c',segments=24,rings=11)
    for ring in range(3):
        n=(14,11,7)[ring]
        for j in range(n):
            a=(j+ring*.5)*math.tau/n;r=(1,.79,.54)[ring]
            x=math.sin(a)*r;z=math.cos(a)*r
            shard(m,'torso',(x*2.16,3.31+ring*.59,z*2.47-.52),(x*3.12,2.48+ring*.77,z*3.40-.48),.76-ring*.09,stone,'rock',5)
            if (j+ring)%2==0:
                m.ell('torso',(x*2.45,3.28+ring*.47,z*2.74-.5),(.45,.14,.49),('#727044','#898244','#5b6140')[ring],segments=8,rings=5)
    for x,y,z,h,w in [(-.75,3.76,-1,2.65,.88),(.56,3.8,-.43,2.9,.96),(1.24,3.92,-1.77,1.72,.71),(-1.25,3.63,.36,1.45,.66),(.33,3.72,1.18,1.67,.70),(-.51,3.63,-2.07,1.54,.69)]:
        shard(m,'torso',(x,y,z),(x-.25,y+h,z-.23),w,stone,'rock',6)
        for i in range(3):
            px=x+.43+i*.19;py=y+.20+i*.19;pz=z+.33-i*.22
            shard(m,'torso',(px,py,pz),(px+.20+.10*i,py+.63+.20*i,pz+.14),.15+i*.035,('#d38535','#ffca73','#fff0bc'))
    for x,y,z,h in [(-1.51,3.9,-1.19,1.00),(1.53,3.65,.57,1.04),(-.72,4.54,.83,.75)]:tree_on_shell(m,x,y,z,h)
    for side in (-1,1):
        x=side*1.91
        for j in range(3):
            dx=(j-1)*.13
            points=[(x*.47+dx,5.14,-.05),(x*.77+dx,4.49,.33),(x*1.12+dx,3.91,.73),(x*1.45+dx,3.38,.94),(x*1.61+dx,2.37,1.02)]
            m.strand('torso',points,.09,'#b9d6ce','#e6f3e9',depth=.24,segments=15,sides=5,kind='water',profile='line')
        crest(m,'torso',(side*3.02,3.20,.68),.43,ochre,'earth',True)
        for front in (True,False):
            z=1.63 if front else -2.05
            hip=(side*1.82,2.43,z);knee=(side*2.04,1.23,z+.16);ankle=(side*2.17,.39,z+.40)
            top,shin,paw=leg(m,side,front,hip,knee,ankle)
            m.ell(top,hip,(.77,.88,.87),skin);m.ell(shin,(knee[0],.87,knee[2]),(.62,.87,.65),skin)
            m.ell(paw,ankle,(.72,.39,.83),'#766454',segments=14,rings=7)
            for j in range(3):
                tx=ankle[0]+(j-1)*.41
                m.strand(paw,[(tx,.42,z+.90),(tx,.33,z+1.17),(tx,.07,z+1.39)],.23,'#bd9964','#e3cfb0',segments=7,sides=9)
            for j in range(5):
                a=(j-2)*.47;px=knee[0]+math.sin(a)*.49;pz=knee[2]+math.cos(a)*.59
                shard(m,shin,(px,1.38,pz),(px+math.sin(a)*.12,.45,pz+.09),.25,stone,'rock',5)
            crest(m,shin,(knee[0],.96,knee[2]+.83),.32,ochre,'earth')
    head=m.part('head',(0,3.29,2.78));m.mouth=(0,3.04,4.11)
    m.ell('torso',(0,2.73,2.02),(.83,1.08,1.16),skin)
    m.ell(head,(0,3.51,3.09),(.89,.73,.98),'#aa9272',segments=20,rings=10)
    m.ell(head,(0,3.17,3.70),(.68,.32,.52),'#bd9f78')
    m.line(head,[(-.56,3.10,3.87),(-.34,3.05,4.10),(.34,3.05,4.10),(.56,3.10,3.87)],.04,'#392d29','fur')
    for side in (-1,1):
        m.ell(head,(side*.54,3.69,3.72),(.165,.078,.094),'#342a25');m.ell(head,(side*.55,3.69,3.786),(.103,.032,.036),'#f9bd5c','eyes')
        m.leaf(head,(side*.21,3.84,3.89),(side*.83,3.95,3.04),.18,'#c7ab86','#766046')
        for j in range(4):
            m.leaf(head,(side*.55,3.77-j*.16,3.38),(side*(.90+j*.08),3.57-j*.17,2.54),.15,'#ba9b78','#786548')
        for j in range(6):
            x=side*(.06+j*.10)
            m.strand(head,[(x,3.02,4.00-abs(x)*.34),(x+.06,2.62,3.94),(x-.06,2.10+j*.046,3.68),(x*x*side,1.56+j*.053,3.58)],.13,'#a58d72','#ede2ca',depth=.44,segments=10,sides=6,profile='plume')
    return m


def frost_or_shadow(id):
    ice=id=='ice';m=Sculpt(id)
    coat='#c3d3e9' if ice else '#2c2038'
    fur='#e6eff8' if ice else '#534462'
    edge='#6e9bc7' if ice else '#8548c0'
    energy='#8be8ff' if ice else '#c074fa'
    armor='#8ea9c0' if ice else '#827286'
    accents=('#66bde8','#1c70b1','#cdf5ff','#a5ddfa')
    width=1.10 if ice else .85
    m.ell('torso',(0,2.68,-.54),(width,1.04 if ice else .90,1.94),coat,segments=22,rings=11)
    m.ell('torso',(0,2.88,.83),(width*1.04,1.15,1.02),coat)
    m.ell('torso',(0,3.51,1.18),(.79 if ice else .68,1.01,.88),fur)
    for row in range(5):
        for j in range(8):
            a=(j-3.5)*.37;x=math.sin(a)*(.58+row*.10);y=4.34-row*.29;z=1.26+math.cos(a)*.65
            m.leaf('torso',(x,y,z),(x*1.33,y-.87,z+.18),.18,fur if (j+row)%3 else coat,edge if (j+row)%4==0 else fur,bend=.12)
    for side in (-1,1):
        for row in range(4):
            for j in range(8):
                x=side*width*(.58+.10*row);y=3.61-row*.37;z=1.12-j*.45
                m.leaf('torso',(x,y,z),(x+side*.31,y-.41,z-.55),.165,coat,fur if ice else edge,bend=.09)
        for j in range(6):
            z=1.06-j*.56;x=side*width
            pts=[(x*.66,3.49,z-.12),(x*.98,3.29,z-.21),(x*1.17,2.95,z-.15),(x*1.13,2.57,z-.03)]
            if ice:
                m.strand('torso',pts,.104,'#24598c','#8dd9f8',depth=.48,segments=9,sides=5)
                m.line('torso',[(x+side*.04,y,z) for x,y,z in pts[:3]],.023,energy,'glow')
            elif j%2==0:
                m.leaf('torso',pts[0],(x*1.31,3.11,z-.52),.23,armor,'#493854','metal',normal=(side,0,0))
        for front in (True,False):
            z=1.07 if front else -1.61;x=side*(.88 if ice else .71)
            hip=(x,2.57,z);knee=(x,1.07,z+(.12 if front else -.26));ankle=(x,.34,z+.28)
            top,shin,paw=leg(m,side,front,hip,knee,ankle)
            m.strand(top,[hip,(x*1.07,1.89,z-.15),knee],.43 if ice else .32,coat,fur,segments=10,sides=10,profile='limb')
            m.strand(shin,[knee,(x,.65,z+.08),ankle],.275 if ice else .19,coat,fur,segments=8,sides=9,profile='limb')
            m.ell(paw,(x,.25,z+.49),(.36 if ice else .29,.25,.46),coat,segments=12,rings=7)
            for j in range(4):
                px=x+(j-1.5)*(.15 if ice else .12)
                m.ell(paw,(px,.18,z+.76),(.10,.13,.19),fur if ice else coat,segments=8,rings=5)
                if ice:shard(m,paw,(px,.23,z+.85),(px,.07,z+1.11),.083,accents,sides=5)
                else:m.strand(paw,[(px,.22,z+.83),(px,.18,z+.99),(px,.07,z+1.08)],.063,'#672bad',energy,kind='glow',segments=6,sides=5)
            m.armor(shin,(x,.88,z+.30),(.19,.73),armor)
            if ice:
                for j in range(3):
                    y=.56+j*.22;shard(m,shin,(x+side*.16,y,z+.29),(x+side*(.47+j*.05),y+.46,z+.10),.12,accents,sides=5)
            else:
                m.line(shin,[(x,.58,z+.53),(x+side*.17,.92,z+.42),(x+side*.09,1.17,z+.35)],.029,energy,'glow')
        shoulder=(side*(width+.14),3.46,.79)
        for j in range(3):
            m.leaf('torso',(shoulder[0],shoulder[1]+.21-j*.27,shoulder[2]+.32),(shoulder[0]+side*.13,shoulder[1]+.42-j*.36,shoulder[2]-.43),.26,armor,edge,'metal',normal=(side,0,0))
        if ice:
            for j in range(4):
                shard(m,'torso',(side*(.59+j*.12),3.61,.96-j*.52),(side*(.85+j*.19),4.81-j*.07,.68-j*.61),.24,accents,sides=6)
            crest(m,'torso',(side*(width+.39),3.45,.76),.28,energy,'snow',True)
        else:
            m.ell('torso',(side*(width+.35),3.45,.76),(.065,.13,.13),'#a74de8','glow',10,6)
            for j in range(3):
                ribbon=m.part(f'spirit-ribbon-{side}-{j}',(0,3,-1.2))
                x=side*(.94+j*.40)
                points=[(x,3.45-j*.31,-1.1),(x+side*.60,3.22,-2.1),(x+side*.81,3.82,-3.18),(x+side*1.05,4.78-j*.12,-3.77),(x+side*.64,4.91-j*.39,-4.28)]
                m.strand(ribbon,points,.26,'#51268a','#c878ef',depth=.14,segments=21,sides=6,kind='spirit',profile='plume')
    head=m.part('head',(0,4.63,1.79));m.mouth=(0,4.31 if ice else 4.38,3.15)
    m.ell(head,(0,4.72,1.91),(.73 if ice else .55,.55 if ice else .46,.83),coat,segments=22,rings=12)
    m.ell(head,(0,4.53,2.45),(.47 if ice else .30,.24,.67),fur,segments=16,rings=8)
    m.ell(head,(0,4.56,3.04),(.19 if ice else .145,.102,.12),'#292839',segments=12,rings=7)
    if ice:
        m.ell(head,(0,4.21,2.64),(.37,.21,.49),'#27334b',segments=14,rings=7)
        m.ell(head,(0,4.04,2.67),(.37,.13,.47),fur,segments=14,rings=7)
    else:
        m.ell(head,(0,4.35,2.54),(.28,.10,.52),fur,segments=14,rings=7)
        m.line(head,[(-.28,4.41,2.57),(-.21,4.40,2.87),(0,4.39,3.05),(.21,4.40,2.87),(.28,4.41,2.57)],.026,'#20182b','fur')
    for side in (-1,1):
        x=side*(.46 if ice else .38)
        eye_depth=2.54 if ice else 2.49
        m.add(head,[(x-side*.115,4.81,eye_depth+.10),(x+side*.14,4.88,eye_depth-.13),(x+side*.12,4.82,eye_depth-.13),(x-side*.07,4.775,eye_depth+.09)],[(0,1,2,3)],'#20364f' if ice else '#1c1728')
        m.add(head,[(x-side*.091,4.804,eye_depth+.105),(x+side*.105,4.854,eye_depth-.092),(x+side*.067,4.812,eye_depth-.042),(x-side*.062,4.79,eye_depth+.104)],[(0,1,2,3)],'#82eaff' if ice else '#8ff9ed','eyes')
        m.leaf(head,(side*.19,5.0,2.56),(side*.75,5.04,2.10),.13,coat,edge)
        if ice:
            m.ell(head,(side*.56,5.17,1.83),(.27,.28,.19),coat)
            m.ell(head,(side*.59,5.19,1.95),(.158,.158,.09),'#51759f',segments=11,rings=7)
            for j in range(3):
                m.strand(head,[(side*.28,5.19-j*.13,2.21),(side*.53,5.09-j*.13,2.23),(side*.70,4.94-j*.12,2.09)],.048,'#315982',edge,depth=.4,segments=7,sides=5)
            m.strand(head,[(side*.25,4.42,2.86),(side*.26,4.26,2.93),(side*.21,4.13,2.92)],.068,'#f3f0df',segments=6,sides=7)
            for j in range(3):m.line(head,[(side*.33,4.61-j*.045,2.85),(side*.59,4.63-j*.045,2.84),(side*.80,4.60-j*.063,2.76)],.009,'#dfe9f4','fur')
        else:
            m.leaf(head,(side*.44,5.02,1.93),(side*.69,5.88,1.36),.24,'#392749','#1b1624',bend=.09)
            m.leaf(head,(side*.47,5.12,2.01),(side*.65,5.69,1.53),.12,edge,'#282131',bend=.08)
        for j in range(8):
            y=5.12-j*.14
            m.leaf(head,(side*(.40+j*.025),y,2.00),(side*(.88+j*.036),y+.33-j*.055,1.32-j*.047),.145,fur,edge,bend=.17)
    for j in range(5):
        x=(j-2)*.14;m.leaf(head,(x,5.11,2.18),(x*.96,5.46+(.14 if j==2 else 0),1.62),.11,coat,edge)
    m.armor('torso',(0,3.37,1.99),(.36,.98),armor)
    if ice:crest(m,'torso',(0,3.43,2.27),.28,energy,'snow')
    else:
        m.rune('torso',(0,3.42,2.25),.28,energy);m.rune(head,(0,5.045,2.56),.14,energy)
    tail=m.part('tail-0',(0,2.48,-1.99))
    points=[(0,2.52,-1.99),(.72,2.36,-2.97),(1.68,2.47,-3.72),(2.11,3.26,-4.15),(1.80,3.98,-3.75),(1.16,4.14,-3.26)]
    m.strand(tail,points,.30 if ice else .54,coat,fur if ice else edge,depth=.82,segments=22,sides=10,profile='limb' if ice else 'plume')
    for j in range(10):
        p=curve(points,.25+j*.073);tip=(p.x+.17*math.cos(j*2.4),p.y-.19,p.z-.46)
        m.leaf(tail,p,tip,.145 if ice else .19,edge,fur if ice else '#bb70ef',bend=.11)
    return m


def living_stag():
    m=Sculpt('wood');cream='#dac5a3';green='#547542';leaf='#b6cc62';gold='#c8ae6d';rune='#e2ff92'
    m.ell('torso',(0,2.78,-.52),(.78,.88,1.99),cream,segments=20,rings=10)
    m.ell('torso',(0,2.95,.96),(.72,1.00,.75),cream)
    m.strand('torso',[(0,2.55,1.14),(0,3.84,1.38),(0,4.83,1.71)],.61,cream,'#f4e4c5',profile='limb',segments=15,sides=12)
    for row in range(5):
        for j in range(7):
            angle=(j-3)*.28
            x=math.sin(angle)*(.48+row*.07);y=4.45-row*.35;z=1.66+math.cos(angle)*.39-row*.04
            m.leaf('torso',(x,y,z),(x*1.18,y-.75,z+.20),.13,cream,'#f7ecd3',bend=.12)
    m.armor('torso',(0,3.16,2.03),(.38,1.00),'#9c8548');crest(m,'torso',(0,3.18,2.29),.31,rune,'leaf')
    for side in (-1,1):
        for j in range(12):
            z=1.17-j*.27
            m.leaf('torso',(side*.39,3.58,z),(side*(.77+j*.018),2.53-(j%2)*.14,z-.43),.23,green,leaf,bend=.16)
        m.strand('torso',[(side*.69,3.48,1.04),(side*.79,3.22,.15),(side*.83,3.43,-.63),(side*.70,3.32,-1.55)],.062,'#92714b',profile='line',segments=16,sides=6,kind='metal')
        crest(m,'torso',(side*.90,2.91,-.99),.34,rune,'leaf',True)
        for front in (True,False):
            z=1 if front else -1.61
            hip=(side*.47,2.66,z);knee=(side*.57,1.21,z+(.08 if front else -.20));ankle=(side*.63,.25,z+.31)
            top,shin,paw=leg(m,side,front,hip,knee,ankle)
            m.strand(top,[hip,(side*.53,1.88,z-.19),knee],.25 if front else .34,cream,profile='limb',segments=10,sides=9)
            m.strand(shin,[knee,(side*.61,.68,z+.05),ankle],.13,cream,profile='limb',segments=9,sides=8)
            for j in (-1,1):
                x=ankle[0]+j*.077;m.ell(paw,(x,.15,z+.42),(.083,.15,.21),'#534638',segments=8,rings=5)
            points=[]
            for j in range(15):
                t=j/14;p=Vector(ankle).lerp(Vector(knee),t);a=t*math.tau*1.65
                points.append((p.x+math.sin(a)*.153,p.y,p.z+math.cos(a)*.173))
            m.line(shin,points,.038,'#758244','fur')
            for p in points[3::4]:m.leaf(shin,p,(p[0]+side*.23,p[1]+.17,p[2]+.05),.09,green,leaf)
    for k in range(24):
        a=k*2.4;x=math.cos(a)*(.32+(k%3)*.14);z=1-k*.137;y=3.57+(k%3)*.07
        m.ell('torso',(x,y,z),(.20,.10,.22),('#526b41','#6f8847','#8c9b52')[k%3],segments=7,rings=4)
        if k%3==0:
            m.ell('torso',(x,y+.13,z),(.036,.16,.036),'#d9c391',segments=7,rings=4)
            m.ell('torso',(x,y+.28,z),(.13,.064,.13),'#b9864b',segments=10,rings=5)
        if k%4==1:
            for j in range(5):
                a=j*math.tau/5;m.ell('torso',(x+math.sin(a)*.068,y+.14,z+math.cos(a)*.068),(.057,.023,.057),'#f0e6ca',segments=6,rings=4)
    head=m.part('head',(0,4.85,1.57));m.mouth=(0,4.72,2.74)
    m.ell(head,(0,4.98,1.62),(.43,.48,.61),cream);m.ell(head,(0,4.77,2.18),(.28,.24,.60),'#ead8b6')
    m.ell(head,(0,4.80,2.73),(.145,.082,.087),'#3f342c',segments=12,rings=6)
    for side in (-1,1):
        m.ell(head,(side*.30,5.04,2.06),(.121,.052,.077),'#3a4b34');m.ell(head,(side*.31,5.045,2.112),(.074,.029,.04),'#cdf985','eyes')
        m.leaf(head,(side*.25,5.24,1.61),(side*1.00,5.50,1.21),.185,'#d6be99','#f0d6b9')
        for j in range(4):m.leaf(head,(side*.37,5.02-j*.13,1.63),(side*.63,4.73-j*.18,1.18),.12,green,leaf)
        limb=[(side*.25,5.35,1.42),(side*.58,5.85,1.25),(side*1.31,6.06,1.11),(side*2.17,6.22,.88),(side*2.83,6.73,.62),(side*2.97,7.48,.51)]
        m.strand(head,limb,.17,'#765337','#be9960',segments=24,sides=8)
        for j,t in enumerate((.32,.47,.63,.78,.90)):
            p=curve(limb,t);dx=side*(.41+(j%3)*.12)
            tip=(p.x+dx,p.y+.59+(j%2)*.17,p.z+.07)
            m.strand(head,[p,(p.x+dx*.85,p.y+.19,p.z+.13),tip],.085,'#876442','#b88b58',segments=8,sides=6)
            for k in range(4):
                start=(p.x+dx*(.5+k*.12),p.y+.15+k*.13,p.z+.10);end=(start[0]+dx*.60,start[1]+.27,start[2]+(-1)**k*.19)
                m.leaf(head,start,end,.125,green,leaf,bend=.10)
        p=curve(limb,.55);d=(p.x,p.y-.64,p.z)
        m.line(head,[p,d],.019,gold);crest(m,head,(d[0],d[1]-.19,d[2]),.19,rune,'leaf')
    for k in range(7):
        x=(k-3)*.15;tail=m.part('tail-'+str(k),(0,3,-1.91))
        m.strand(tail,[(x*.28,3.34,-1.91),(x*1.4,2.99,-2.55),(x*2.04,2.38,-3.29),(x*2.31,1.55,-3.65)],.26,green,leaf,depth=.22,segments=15,sides=6,profile='plume')
    return m


def solar_eagle():
    m=Sculpt('light');ivory='#f0e6cd';gold='#d89d3c';warm='#ffda82';bronze='#9c6935'
    m.ell('torso',(0,2.91,-.12),(.88,1.36,.84),'#9a6d41',segments=20,rings=11)
    m.ell('torso',(0,4.05,.21),(.53,1.02,.55),ivory)
    for row in range(7):
        for j in range(7):
            x=(j-3)*(.17-row*.004);y=4.52-row*.365;z=.46+math.cos((j-3)*.39)*.33
            m.leaf('torso',(x,y,z),(x*1.22,y-.75,z+.11),.15,ivory,warm if row>4 else '#fcf0d5',bend=.12)
    head=m.part('head',(0,5.12,.46));m.mouth=(0,4.95,1.76)
    m.ell(head,(0,5.19,.62),(.52,.44,.68),ivory,segments=20,rings=11)
    m.strand(head,[(0,5.14,1.04),(0,5.10,1.55),(0,4.86,1.72)],.29,gold,'#bf7e29',depth=.68,segments=12,sides=10,kind='metal')
    for side in (-1,1):
        m.ell(head,(side*.36,5.26,1.01),(.16,.072,.13),'#553622');m.ell(head,(side*.39,5.28,1.08),(.105,.04,.055),'#fff1ad','eyes')
        for j in range(6):
            m.leaf(head,(side*.18,5.45-j*.065,.94-j*.065),(side*(.55+j*.065),5.69-j*.08,-.48-j*.065),.125,ivory,gold if j%2 else warm,bend=.11)
        wing=m.part('wing-'+('left' if side>0 else 'right'),(side*.77,3.99,-.19))
        bones=[(.65,3.85,-.16),(1.72,4.94,-.29),(2.95,5.74,-.38),(4.17,5.58,-.41),(5.61,4.62,-.52)]
        points=[(side*x,y,z) for x,y,z in bones]
        m.strand(wing,points,.30,bronze,gold,segments=19,sides=8,profile='limb')
        for j in range(19):
            t=j/18;p=curve(points,.13+t*.87)
            end=(p.x+side*(.42+t*1.0),p.y-1.53-(math.sin(t*math.pi)*.54+t*.73),p.z-.09-t*.48)
            m.leaf(wing,p,end,.34-t*.08,('#9a642c','#ba7e30','#ce8e32')[j%3],warm,bend=.17)
            if j%3==0:
                m.leaf(wing,Vector(p).lerp(Vector(end),.63)+Vector((0,0,.09)),end,.056,'#f4b746','#ffdf8a','glow',bend=.08)
        for row in range(3):
            for j in range(15):
                t=j/14;p=curve(points,.06+t*.89);p.y-=row*.40;p.z+=.07+row*.096
                end=(p.x+side*(.36+t*.36),p.y-.90-row*.12,p.z+.08)
                m.leaf(wing,p,end,.25,ivory if row<2 else '#dba856',warm,bend=.115)
        for j in range(5):
            p=curve(points,.21+j*.085);p.z+=.28
            m.leaf(wing,(p.x,p.y+.26,p.z),(p.x+side*.55,p.y-.65,p.z+.11),.23,gold,'#f1d7a2','metal',bend=.10)
        top,shin,paw=leg(m,side,True,(side*.48,2.36,.05),(side*.55,1.25,.12),(side*.59,.29,.20))
        m.strand(top,[(side*.48,2.36,.05),(side*.64,1.8,.02),(side*.55,1.25,.12)],.28,ivory,warm,profile='limb',segments=10,sides=9)
        m.strand(shin,[(side*.55,1.25,.12),(side*.58,.74,.17),(side*.59,.29,.20)],.16,bronze,gold,profile='limb',segments=8,sides=8)
        for j in range(3):
            m.leaf(shin,(side*.54,1.14-j*.24,.26),(side*.65,.90-j*.24,.42),.18,gold,'#f9df9f','metal',bend=.05)
            x=side*.59+(j-1)*.20
            m.strand(paw,[(side*.59,.30,.21),(x,.24,.56),(x,.08,.79)],.11,gold,'#6c4b31',segments=8,sides=8,kind='metal')
        m.strand(paw,[(side*.58,.28,.18),(side*.74,.21,-.13),(side*.78,.09,-.31)],.10,gold,bronze,segments=7,sides=7,kind='metal')
    for j in range(8):
        x=(j-3.5)*.235;tail=m.part('tail-'+str(j),(0,2.46,-.57))
        m.strand(tail,[(x*.38,2.57,-.66),(x*.96,1.72,-1.55),(x*1.42,.56,-2.66),(x*1.65,.33,-3.87)],.29,ivory,warm,depth=.17,segments=16,sides=7,profile='plume')
    halo=m.part('halo',(0,5.53,-.31))
    m.line(halo,[(math.sin(j*math.tau/56)*1.17,5.53+math.cos(j*math.tau/56)*1.17,-.31) for j in range(57)],.027,warm,'glow')
    crest(m,halo,(0,5.53,-.30),1.52,warm)
    m.armor('torso',(0,3.64,.93),(.43,1.08),bronze)
    m.ell('torso',(0,3.74,1.19),(.16,.18,.08),warm,'glow',14,8)
    crest(m,'torso',(0,3.74,1.29),.39,warm)
    return m


MODELS.update(earth=mountain_turtle(),wood=living_stag(),ice=frost_or_shadow('ice'),light=solar_eagle(),dark=frost_or_shadow('dark'))
