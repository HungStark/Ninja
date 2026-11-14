import assert from 'node:assert/strict';
import {createRenderBudget,renderPixelRatio,RENDER_PIXEL_BUDGETS} from '../src/render-budget.js';

for(let quality=0;quality<3;quality++)for(const [width,height,dpr] of [[3840,2160,3],[1920,1080,2],[915,412,3],[412,915,1],[1,1,1]]){
  const ratio=renderPixelRatio(width,height,dpr,quality);
  assert.ok(width*height*ratio*ratio<=RENDER_PIXEL_BUDGETS[quality]+1e-6,'3D pixel budget holds on high-DPI displays');
  assert.ok(ratio<=dpr,'never supersample past the device ratio');
  assert.equal(renderPixelRatio(width,height,dpr,quality,.6),ratio*.6);
}
const budget=createRenderBudget(),run=(ms,count,active=true)=>{for(let i=0;i<count;i++)budget.sample(ms,active);};
run(1000/60,600);assert.equal(budget.state().scale,1,'stable 60 FPS keeps full detail');
budget.sample(200);run(1000/60,180);assert.equal(budget.state().scale,1,'one long frame does not trigger a resolution drop');
run(1000/30,150);assert.ok(budget.state().scale<1,'sustained slow frames lower resolution');
run(1000/15,500);assert.equal(budget.state().scale,.6,'resolution has a readability floor');
run(1000/60,150);assert.equal(budget.state().scale,.6,'recovery waits for sustained headroom');
run(1000/60,1000);assert.ok(budget.state().scale>.6&&budget.state().scale<=1,'resolution recovers gradually');
const previous=budget.state().scale;run(100,100,false);assert.equal(budget.state().scale,previous,'pause/background frames cannot change quality');
run(1000,100);assert.equal(budget.state().scale,previous,'loading/resume stalls are ignored');
run(1000/60,3000);assert.equal(budget.state().scale,1,'recovery never exceeds the selected quality');
console.log('PASS: high-DPI pixel caps, sustained-load adaptation, slow recovery, pause/loading exclusion and resolution floor.');
