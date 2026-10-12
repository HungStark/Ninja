import bpy, bmesh, json
from mathutils.bvhtree import BVHTree
from mathutils.geometry import intersect_ray_tri
from pathlib import Path

bm=bmesh.new();bm.from_mesh(bpy.data.objects['hand_skin'].data)
bmesh.ops.triangulate(bm,faces=list(bm.faces))
bm.faces.ensure_lookup_table();bm.faces.index_update();bm.verts.index_update()
tree=BVHTree.FromBMesh(bm,epsilon=1e-8)
hits=[]
for a,b in tree.overlap(tree):
    if a>=b:continue
    fa,fb=bm.faces[a],bm.faces[b]
    if set(fa.verts)&set(fb.verts):continue
    for src,dst in [(fa,fb),(fb,fa)]:
        found=False
        pts=[v.co for v in dst.verts]
        for edge in src.edges:
            p,q=[v.co for v in edge.verts];delta=q-p;length=delta.length
            if length<1e-8:continue
            direction=delta/length
            hit=intersect_ray_tri(*pts,direction,p,True)
            if hit is not None and 1e-7<(hit-p).dot(direction)<length-1e-7:
                hits.append({'triangles':[a,b],'point':list(hit)});found=True;break
        if found:break
print('SKIN SELF INTERSECTIONS',json.dumps({'count':len(hits),'examples':hits[:20]}))
(Path(__file__).resolve().parent.parent/'test-results/hand-volume/intersections.json').write_text(json.dumps({'count':len(hits),'examples':hits},indent=2))
bm.free()
