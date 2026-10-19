import * as T from 'three';

// Subtract the switchback corridor from the mountain's actual skin, then fill
// it with stair treads and exposed cut faces. Nothing is mounted over the rock.
export function carveMountainStairs(source,sample,route){
  const rectangles=[],cuts=[],path=[],half=.8,flightCount=9,totalSteps=124,toY=36.16,rise=(toY-route.fromY)/totalSteps;
  const point=(x,y,z)=>({x,y,z}),rect=(x0,x1,z0,z1,y,step=0)=>({x0:Math.min(x0,x1),x1:Math.max(x0,x1),z0:Math.min(z0,z1),z1:Math.max(z0,z1),y,step});
  const landing=(x,z0,z1,y)=>{const r=rect(x-half,x+half,z0-1,z1+1,y);rectangles.push(r);cuts.push(r);};
  let x=route.from[0],y=route.fromY,step=0;path.push(point(x,y,route.from[1]));landing(x,route.from[1],route.from[1]+6,y);
  for(let flight=0;flight<flightCount;flight++){
    const z=route.from[1]-flight*2,nextX=flight===8?88:flight%2===0?84:92,sign=Math.sign(nextX-x),start=x+sign*half,end=nextX-sign*half,n=flight===0||flight===8?6:16;
    cuts.push(rect(start,end,z-1,z+1,0));
    for(let k=0;k<n;k++){const a=start+(end-start)*k/n,b=start+(end-start)*(k+1)/n;step++;y=route.fromY+step*rise;rectangles.push(rect(a,b,z-1,z+1,y,step));path.push(point((a+b)/2,y,z));}
    x=nextX;path.push(point(x,y,z));
    if(flight<8){landing(x,z-2,z,y);path.push(point(x,y,z-2));}else {landing(x,route.to[1],z,y);path.push(point(...[route.to[0],y,route.to[1]]));}
  }
  const axis=key=>[...new Set(rectangles.flatMap(r=>[r[key+'0'],r[key+'1']]).map(n=>+n.toFixed(6)))].sort((a,b)=>a-b),xs=axis('x'),zs=axis('z'),cols=xs.length-1,rows=zs.length-1,heights=new Float64Array(cols*rows).fill(NaN),steps=new Uint16Array(cols*rows);
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const x=(xs[i]+xs[i+1])/2,z=(zs[j]+zs[j+1])/2,r=rectangles.find(r=>x>r.x0-1e-6&&x<r.x1+1e-6&&z>r.z0-1e-6&&z<r.z1+1e-6);if(r){heights[j*cols+i]=r.y;steps[j*cols+i]=r.step;}}
  const search=(axis,v)=>{let lo=0,hi=axis.length-1;if(v<axis[lo]||v>axis[hi])return -1;while(hi-lo>1){const m=(lo+hi)>>1;if(axis[m]<=v)lo=m;else hi=m;}return Math.min(lo,axis.length-2);};
  const heightAt=(x,z)=>{const i=search(xs,x),j=search(zs,z);return i<0||j<0?NaN:heights[j*cols+i];};
  const positions=[],colors=[],pale=new T.Color('#96947b'),face=new T.Color('#747966');
  const triangle=(a,b,c,color)=>{const u=b.map((v,i)=>v-a[i]),v=c.map((v,i)=>v-a[i]),nx=u[1]*v[2]-u[2]*v[1],ny=u[2]*v[0]-u[0]*v[2],nz=u[0]*v[1]-u[1]*v[0];if(nx*nx+ny*ny+nz*nz<1e-12)return;positions.push(...a,...b,...c);for(let k=0;k<3;k++)colors.push(color.r,color.g,color.b);};
  const quad=(a,b,c,d,color,normal)=>{const u=new T.Vector3(...b).sub(new T.Vector3(...a)),v=new T.Vector3(...c).sub(new T.Vector3(...a));if(u.cross(v).dot(new T.Vector3(...normal))<0){triangle(a,c,b,color);triangle(a,d,c,color);}else {triangle(a,b,c,color);triangle(a,c,d,color);}};
  const clip=(poly,component,value,positive)=>{const out=[];for(let k=0;k<poly.length;k++){const a=poly[k],b=poly[(k+1)%poly.length],da=(a[component]-value)*(positive?1:-1),db=(b[component]-value)*(positive?1:-1);if(da>=-1e-8)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push(a.map((v,j)=>v+(b[j]-v)*t));}}return out;};
  const subtract=(poly,r)=>{const result=[];let inside=poly;for(const [component,value,positive] of [[0,r.x0,true],[0,r.x1,false],[2,r.z0,true],[2,r.z1,false]]){if(inside.length<3)break;const outside=clip(inside,component,value,!positive);if(outside.length>=3)result.push(outside);inside=clip(inside,component,value,positive);}return result;};
  const p=source.attributes.position,c=source.attributes.color;
  for(let k=0;k<p.count;k+=3){let polys=[[0,1,2].map(j=>[p.getX(k+j),p.getY(k+j),p.getZ(k+j)])];const color=new T.Color(c.getX(k),c.getY(k),c.getZ(k));for(const r of cuts){const next=[];for(const poly of polys){if(Math.max(...poly.map(p=>p[0]))<=r.x0+1e-7||Math.min(...poly.map(p=>p[0]))>=r.x1-1e-7||Math.max(...poly.map(p=>p[2]))<=r.z0+1e-7||Math.min(...poly.map(p=>p[2]))>=r.z1-1e-7)next.push(poly);else next.push(...subtract(poly,r));}polys=next;}
    for(const poly of polys)for(let j=1;j<poly.length-1;j++)triangle(poly[0],poly[j],poly[j+1],color);
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const h=heights[j*cols+i];if(!Number.isFinite(h))continue;const x0=xs[i],x1=xs[i+1],z0=zs[j],z1=zs[j+1],color=pale.clone().lerp(face,(steps[j*cols+i]%4)*.025);
    quad([x0,h,z0],[x0,h,z1],[x1,h,z1],[x1,h,z0],color,[0,1,0]);
    for(const [di,dj,a,b,normal] of [[-1,0,[x0,z0],[x0,z1],[-1,0,0]],[1,0,[x1,z1],[x1,z0],[1,0,0]],[0,-1,[x1,z0],[x0,z0],[0,0,-1]],[0,1,[x0,z1],[x1,z1],[0,0,1]]]){
      const ni=i+di,nj=j+dj,other=ni>=0&&ni<cols&&nj>=0&&nj<rows?heights[nj*cols+ni]:NaN,outside=!Number.isFinite(other);if(!outside&&other>=h-1e-5)continue;
      const ha=outside?sample(...a):other,hb=outside?sample(...b):other;if(Math.max(Math.abs(h-ha),Math.abs(h-hb))<1e-5)continue;
      const direction=outside&&(ha+hb)/2>h?normal.map(n=>-n):normal;
      quad([a[0],h,a[1]],[b[0],h,b[1]],[b[0],hb,b[1]],[a[0],ha,a[1]],face,direction);
    }
  }
  const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new T.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();
  const distances=[0];for(let k=1;k<path.length;k++)distances.push(distances.at(-1)+Math.hypot(path[k].x-path[k-1].x,path[k].z-path[k-1].z));
  route.toY=toY;route.carved={path,distances,length:distances.at(-1),heightAt,stepCount:totalSteps,rise,cutCount:cuts.length};
  return geometry;
}
