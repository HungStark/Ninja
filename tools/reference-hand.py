"""Adapt the supplied volumetric hand, rebuild distal tips and bind game bones.

The reference GLB remains untouched. UV/normal seam duplicates are welded before
editing. Its sculpted palm/webbing is retained; the long fused nail extrusions
are replaced with rounded 3D distal caps and separate close-fitting nails.
"""
import bpy,bmesh,math
from mathutils import Vector

FINGERS=[
    dict(name='index',base=(-.054,.102,-.015),length=.146,radius=.015,angle=0),
    dict(name='middle',base=(-.016,.106,-.015),length=.159,radius=.0155,angle=0),
    dict(name='ring',base=(.018,.103,-.015),length=.146,radius=.0135,angle=0),
    dict(name='little',base=(.052,.091,-.014),length=.113,radius=.0125,angle=0),
    dict(name='thumb',base=(-.071,-.012,-.025),length=.139,radius=.016,angle=.36),
]

def reconstruct_reference(source,material,weights):
    old=set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=str(source))
    added=set(bpy.context.scene.objects)-old
    obj=next(o for o in added if o.type=='MESH')
    world=[obj.matrix_world@v.co for v in obj.data.vertices]
    lo=min(p.z for p in world);hi=max(p.z for p in world)
    scale=.430/(hi-lo)
    obj.parent=None;obj.matrix_world.identity()
    for v,p in zip(obj.data.vertices,world):
        v.co=Vector((-p.x*scale,(p.z-lo)*scale-.145,-p.y*scale-.010))
    for other in added-{obj}:bpy.data.objects.remove(other,do_unlink=True)
    obj.data.materials.clear();obj.data.materials.append(material)
    bm=bmesh.new();bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=1e-6)

    def replace_tip(xlo,xhi,ycut,length,fi,lean=0):
        # All selected faces belong to one separated finger branch, so bisecting
        # this subset cannot trim neighbouring fingers or the palm.
        domain=[f for f in bm.faces if all(xlo<v.co.x<xhi and v.co.y>ycut-.055 for v in f.verts)]
        geom=set(domain)
        for f in domain:geom.update(f.edges);geom.update(f.verts)
        bmesh.ops.bisect_plane(bm,geom=list(geom),dist=1e-7,
            plane_co=(0,ycut,0),plane_no=(0,1,0),clear_outer=True)
        boundary=[e for e in bm.edges if e.is_boundary and all(abs(v.co.y-ycut)<1e-5 and xlo<v.co.x<xhi for v in e.verts)]
        if not boundary:raise RuntimeError(f'No distal loop at {ycut}')
        first=boundary[0].verts[0];loop=[first];previous=None;current=first
        while True:
            neighbors=[e.other_vert(current) for e in current.link_edges if e in boundary and e.other_vert(current)!=previous]
            nxt=neighbors[0]
            if nxt==first:break
            loop.append(nxt);previous,current=current,nxt
            if len(loop)>len(boundary):raise RuntimeError('Invalid distal ring')
        assert len(loop)==len(boundary),'Distal cap must have one continuous ring'
        xmin,xmax=min(v.co.x for v in loop),max(v.co.x for v in loop)
        zmin,zmax=min(v.co.z for v in loop),max(v.co.z for v in loop)
        cx,cz=(xmin+xmax)/2,(zmin+zmax)/2
        rx,rz=(xmax-xmin)/2,(zmax-zmin)/2
        print('REBUILT TIP',FINGERS[fi]['name'],cx,cz,rx,rz)
        origin=[v.co.copy() for v in loop]
        previous=loop
        for t in (.16,.33,.50,.67,.81,.92,.98):
            shrink=math.sqrt(1-t*t);ring=[]
            for p in origin:
                angle=math.atan2((p.z-cz)/rz,(p.x-cx)/rx)
                ellipse=Vector((rx*math.cos(angle),0,rz*math.sin(angle)))
                old_offset=Vector((p.x-cx,0,p.z-cz))
                blend=min(1,t*3)
                offset=old_offset.lerp(ellipse,blend)*shrink
                ring.append(bm.verts.new(Vector((cx+lean*length*t,ycut+length*t,cz-.002*t))+offset))
            for j in range(len(loop)):
                k=(j+1)%len(loop);bm.faces.new((previous[j],previous[k],ring[k],ring[j]))
            previous=ring
        tip=bm.verts.new((cx+lean*length,ycut+length,cz-.002))
        for j in range(len(loop)):bm.faces.new((previous[j],previous[(j+1)%len(loop)],tip))
        f=FINGERS[fi]
        if fi<4:f['base']=(cx,f['base'][1],f['base'][2])
        else:
            dx=f['base'][0]-tip.co.x;dy=tip.co.y-f['base'][1]
            f['angle']=math.atan2(dx,dy);f['length']=math.hypot(dx,dy)

    replace_tip(-.080,-.036,.215,.033,0)
    replace_tip(-.036,.002,.230,.035,1)
    replace_tip(.002,.035,.215,.034,2)
    replace_tip(.035,.078,.170,.034,3)
    replace_tip(-.160,-.081,.077,.045,4,-.38)
    # Close only the original open wrist; no flat outline is used to build skin.
    boundary=[e for e in bm.edges if e.is_boundary]
    bmesh.ops.holes_fill(bm,edges=boundary,sides=0)
    bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces))
    bm.to_mesh(obj.data);bm.free()
    bpy.context.view_layer.objects.active=obj
    bpy.ops.object.select_all(action='DESELECT');obj.select_set(True)
    if obj.data.has_custom_normals:bpy.ops.mesh.customdata_custom_splitnormals_clear()
    # Keep the artist's connected palm topology. Subdivide it directly, rather
    # than voxelizing/decimating the large curved surfaces into uneven triangles.
    rounded=obj.modifiers.new('Reference surface and reconstructed caps','SUBSURF');rounded.levels=1
    bpy.ops.object.modifier_apply(modifier=rounded.name)
    smooth=obj.modifiers.new('Blend distal reconstruction','SMOOTH');smooth.factor=.10;smooth.iterations=2
    bpy.ops.object.modifier_apply(modifier=smooth.name)
    for p in obj.data.polygons:p.use_smooth=True
    obj.name='hand_skin'

    # Root weights fade into the metacarpals. Each finger receives three smooth
    # joint zones; the palm is attached to the wrist so the webbing stays joined.
    names=['wrist']+[f['name']+'_'+str(j) for f in FINGERS for j in range(3)]
    obj.vertex_groups.clear()
    for name in names:obj.vertex_groups.new(name=name)
    for v in obj.data.vertices:
        x,y,z=v.co
        assignment={};total=0
        for f in FINGERS:
            c,s=math.cos(f['angle']),math.sin(f['angle'])
            dx,dy=x-f['base'][0],y-f['base'][1]
            along=-dx*s+dy*c
            across=abs(dx*c+dy*s)
            t=along/f['length']
            root=max(0,min(1,(t+.15)/.27));root=root*root*(3-2*root)
            outer,span=(2.8,1.8) if f['name']=='thumb' else (1.8,.7)
            radial=max(0,min(1,(f['radius']*outer-across)/(f['radius']*span)))
            radial=radial*radial*(3-2*radial)
            influence=root*radial
            total+=influence
            for name,w in weights(f,max(0,t)).items():assignment[name]=assignment.get(name,0)+w*influence
        assignment['wrist']=max(0,1-total)
        if total>1:assignment={name:w/total for name,w in assignment.items()}
        # Beyond the web each branch is physically separate. Do not let a ring
        # fingertip inherit middle-finger bones merely because their X fields
        # overlap: that drags one finger when its neighbour takes another pose.
        if y>.115 and x>-.081:
            own=min(FINGERS[:4],key=lambda f:abs(x-f['base'][0]))
            t=max(0,(y-own['base'][1])/own['length'])
            blend=max(0,min(1,(y-.115)/.025));blend=blend*blend*(3-2*blend)
            assignment={name:w*(1-blend) for name,w in assignment.items()}
            for name,w in weights(own,t).items():assignment[name]=assignment.get(name,0)+w*blend
        for name,w in assignment.items():
            if w>1e-6:obj.vertex_groups[name].add([v.index],w,'REPLACE')
    obj['source']='anime_style_hand.glb supplied by user; welded and volumetrically adapted'
    obj['topology']='Retained reference palm/webbing topology, rebuilt volumetric distal tips, subdivision level 1, smooth joint weights'
    return obj,FINGERS
