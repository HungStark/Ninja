import * as T from 'three';
import { windTime } from './materials.js';

// Keep the authored widths available for a later, thinner character contour.
export const CHARACTER_OUTLINES_ENABLED = false;
export function characterInkMaterial(width = 1, color = '#342d36') {
  const material = inkMaterial(width, color);
  // Material visibility also holds when the distance budget shows outline meshes.
  material.visible = CHARACTER_OUTLINES_ENABLED;
  return material;
}

// Width is measured in screen pixels, so the contour stays fine during camera cuts.
export function inkMaterial(width = 1, color = '#342d36', wind = false) {
  return new T.ShaderMaterial({
    name: 'AnimeInk', side: T.BackSide,
    uniforms: { ink: { value: new T.Color(color) }, width: { value: width }, viewport: { value: new T.Vector2(1440, 960) }, uWindTime: windTime },
    vertexShader: `#include <common>
      #include <skinning_pars_vertex>
      uniform vec2 viewport;uniform float width;uniform float uWindTime;
      void main(){
        #include <skinbase_vertex>
        #include <beginnormal_vertex>
        #include <skinnormal_vertex>
        #include <begin_vertex>
        ${wind ? `vec3 windOrigin=(modelMatrix*vec4(0.,0.,0.,1.)).xyz;
          float windPhase=uWindTime*1.65+windOrigin.x*.39+windOrigin.z*.25;
          float bend=max(position.y,0.);
          transformed.x+=sin(windPhase)*bend*bend*.16;
          transformed.z+=cos(windPhase*.79)*bend*.09;` : ''}
        #include <skinning_vertex>
        vec4 viewPosition=modelViewMatrix*vec4(transformed,1.);
        vec4 clipPosition=projectionMatrix*viewPosition;
        vec3 viewNormal=normalize(normalMatrix*objectNormal);
        vec2 direction=(projectionMatrix*vec4(viewNormal,0.)).xy;
        float lengthSquared=dot(direction,direction);
        if(lengthSquared>.000001)clipPosition.xy+=direction*inversesqrt(lengthSquared)*width*2./viewport*clipPosition.w;
        gl_Position=clipPosition;
      }`,
    fragmentShader: `uniform vec3 ink;void main(){gl_FragColor=vec4(ink,1.);
      #include <tonemapping_fragment>
      #include <colorspace_fragment>
    }`
  });
}

export function addInkOutline(source, material) {
  if(source.userData.hasInkOutline)return source.children.find(child=>child.userData.inkOutline)||null;
  const outline = source.isSkinnedMesh ? new T.SkinnedMesh(source.geometry, material) : new T.Mesh(source.geometry, material);
  outline.name = source.name + '_ink'; outline.userData.inkOutline = true;
  source.userData.hasInkOutline = true;
  outline.frustumCulled = source.frustumCulled;
  if(source.isSkinnedMesh) {
    // Share the live skeleton and bind matrices; the outline bends with every seal.
    outline.bindMode = source.bindMode; outline.skeleton = source.skeleton;
    outline.bindMatrix.copy(source.bindMatrix); outline.bindMatrixInverse.copy(source.bindMatrixInverse);
  }
  source.add(outline);
  return outline;
}
