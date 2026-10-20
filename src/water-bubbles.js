import * as T from 'three';

// Four fixed water mines with independent, staggered timers.
export class WaterBubbles {
  constructor(scene){
    this.scene=scene;this.bubbles=[];this.bursts=[];this.detonations=[];this.clock=0;
    this.sphere=new T.SphereGeometry(1,16,10);this.ring=new T.TorusGeometry(1,.018,5,28);
    this.water=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{time:{value:0}},
      vertexShader:'varying vec3 n;varying vec3 view;void main(){vec4 p=modelViewMatrix*vec4(position,1.);n=normalize(normalMatrix*normal);view=normalize(-p.xyz);gl_Position=projectionMatrix*p;}',
      fragmentShader:`uniform float time;varying vec3 n;varying vec3 view;void main(){float rim=pow(1.-abs(dot(normalize(n),normalize(view))),2.);float ripple=.5+.5*sin(n.y*18.+time*3.);gl_FragColor=vec4(mix(vec3(.06,.35,.62),vec3(.65,.94,1.),rim),.13+rim*.62+ripple*.06);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
      }`});
    this.foam=new T.MeshBasicMaterial({color:'#b5f5ff',transparent:true,opacity:.65,depthWrite:false});
  }
  cast(owner,spell,target){
    for(let i=0;i<spell.count;i++){
      const angle=i*Math.PI*2/spell.count,p=[target[0]+Math.cos(angle)*spell.placementRadius,target[1]+(i%2?.5:-.5),target[2]+Math.sin(angle)*spell.placementRadius];
      p[1]=Math.max(spell.size+.1,p[1]);
      const root=new T.Group();root.name='water-bubble';root.position.fromArray(p);root.scale.setScalar(spell.size);
      root.add(new T.Mesh(this.sphere,this.water));
      const rim=new T.Mesh(this.ring,this.foam);rim.rotation.x=.6;root.add(rim);
      const glint=new T.Mesh(this.sphere,this.foam);glint.scale.set(.11,.22,.055);glint.position.set(-.35,.42,.79);glint.rotation.z=-.4;root.add(glint);
      this.scene.add(root);this.bubbles.push({owner,spell,p,age:0,detonateAt:(i+1)*spell.detonationInterval,root,rim,index:i});
    }
  }
  detonate(bubble,actors,hit,time=this.clock){
    const index=this.bubbles.indexOf(bubble);if(index<0)return;
    this.bubbles.splice(index,1);bubble.root.removeFromParent();
    const {spell,p,owner}=bubble,radius=spell.blastRadius,damage=spell.damage;
    const root=new T.Group(),material=new T.MeshBasicMaterial({color:'#5bcfff',transparent:true,opacity:.32,depthWrite:false,wireframe:false});root.position.fromArray(p);
    root.add(new T.Mesh(this.sphere,material));
    for(const tilt of [0,Math.PI/2]){const ring=new T.Mesh(this.ring,material);ring.rotation.x=tilt;root.add(ring);}
    root.scale.setScalar(.1);this.scene.add(root);this.bursts.push({root,material,radius,age:0,life:.5});
    this.detonations.push({owner,position:[...p],radius,damage,time});if(this.detonations.length>64)this.detonations.shift();
    for(const victim of actors.filter(a=>a.owner!==owner&&a.fighter?.hp!==0)){
      if(Math.hypot(...victim.pos.map((v,i)=>v-p[i]))<=radius){
        const delta=victim.pos.map((v,i)=>v-p[i]),length=Math.hypot(...delta)||1;
        hit({owner,victimId:victim.id,element:'water',style:'waterbubbles',damage,unreflectable:true,v:delta.map(v=>v/length),color:spell.color},p);
      }
    }
  }
  advance(dt,actors,hit){
    if(!(dt>0))return;this.clock+=dt;this.water.uniforms.time.value=this.clock;
    for(const burst of [...this.bursts]){burst.age+=dt;const t=burst.age/burst.life;burst.root.scale.setScalar(.1+burst.radius*Math.min(1,t));burst.material.opacity=.34*Math.max(0,1-t);if(t>=1){burst.root.removeFromParent();burst.material.dispose();this.bursts.splice(this.bursts.indexOf(burst),1);}}
    for(const bubble of [...this.bubbles]){
      bubble.age+=dt;const urgency=1-Math.min(1,Math.max(0,bubble.detonateAt-bubble.age)),pulse=1+Math.sin(this.clock*(3+urgency*9)+bubble.index)*(.025+urgency*.035);
      bubble.root.scale.setScalar(bubble.spell.size*pulse);bubble.root.position.y=bubble.p[1]+Math.sin(this.clock*2+bubble.index)*.05;bubble.rim.rotation.y=this.clock*.5;
      if(bubble.age+1e-7>=bubble.detonateAt)this.detonate(bubble,actors,hit,this.clock-Math.max(0,bubble.age-bubble.detonateAt));
    }
  }
  state(){return {bubbles:this.bubbles.map(b=>({owner:b.owner,position:[...b.p],remaining:Math.max(0,b.detonateAt-b.age),size:b.spell.size})),bursts:this.bursts.map(b=>({radius:b.radius,age:b.age})),detonations:this.detonations.map(d=>({...d,position:[...d.position]}))};}
  reset(){for(const b of this.bubbles)b.root.removeFromParent();for(const b of this.bursts){b.root.removeFromParent();b.material.dispose();}this.bubbles=[];this.bursts=[];this.detonations=[];this.clock=0;}
}
