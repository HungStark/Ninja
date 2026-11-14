// Static scenery boxes use half extents, matching adventure-scene's original test.
export function createObstacleIndex(boxes,cellSize=16){
  const cells=new Map(),empty=[];let count=-1,queries=0,candidates=0;
  function rebuild(){
    cells.clear();count=boxes.length;
    for(const box of boxes){
      const minX=Math.floor((box.x-box.w)/cellSize),maxX=Math.floor((box.x+box.w)/cellSize),minZ=Math.floor((box.z-box.d)/cellSize),maxZ=Math.floor((box.z+box.d)/cellSize);
      for(let x=minX;x<=maxX;x++)for(let z=minZ;z<=maxZ;z++){const key=x+','+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(box);}
    }
  }
  return {
    query(x,z){if(count!==boxes.length)rebuild();const found=cells.get(Math.floor(x/cellSize)+','+Math.floor(z/cellSize))||empty;queries++;candidates+=found.length;return found;},
    rebuild,
    state:()=>({boxes:boxes.length,cells:cells.size,queries,candidates})
  };
}
