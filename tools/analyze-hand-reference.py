import bpy,bmesh,json
from pathlib import Path
obj=bpy.data.objects['hand_skin'];bm=bmesh.new();bm.from_mesh(obj.data)
bm.verts.ensure_lookup_table();bm.verts.index_update()
def components(verts):
    todo=set(verts);out=[]
    while todo:
        stack=[todo.pop()];part=[]
        while stack:
            v=stack.pop();part.append(v)
            for e in v.link_edges:
                n=e.other_vert(v)
                if n in todo:todo.remove(n);stack.append(n)
        out.append(part)
    return sorted(out,key=len,reverse=True)
def info(part):
    return {'vertices':len(part),'bounds':[[min(v.co[i] for v in part),max(v.co[i] for v in part)] for i in range(3)]}
print('COMPONENTS',json.dumps([info(p) for p in components(bm.verts)]))
for y in (.08,.10,.12,.14):
    print('ABOVE',y,json.dumps([info(p) for p in components([v for v in bm.verts if v.co.y>y])]))
print('BOUNDARIES',json.dumps([list(v.co) for v in bm.verts if v.is_boundary]))
(Path(__file__).resolve().parent.parent/'test-results/hand-reference/reference-vertices.json').write_text(json.dumps([list(v.co) for v in bm.verts]))
