import * as T from "three";
export const windTime = { value: 0 };
let gradient;
function ramp() {
  if (gradient) return gradient;
  const tex = new T.DataTexture(new Uint8Array([88, 88, 88, 255, 155, 155, 155, 255, 217, 217, 217, 255, 255, 255, 255, 255]), 4, 1, T.RGBAFormat);
  tex.minFilter = tex.magFilter = T.NearestFilter;
  tex.generateMipmaps = false;
  tex.needsUpdate = true;
  return gradient = tex;
}
const windChunk = ["#include <begin_vertex>", "vec3 windOrigin=(modelMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;", "#ifdef USE_INSTANCING", "windOrigin=(modelMatrix*instanceMatrix*vec4(0.0,0.0,0.0,1.0)).xyz;", "#endif", "float windPhase=uWindTime*1.65+windOrigin.x*.39+windOrigin.z*.25;", "float bend=max(position.y,0.0);", "transformed.x+=sin(windPhase)*bend*bend*.16;", "transformed.z+=cos(windPhase*.79)*bend*.09;"].join("\n");
export function toon(color, options = {}) {
  const { wind = false, rim = 0.12, ...rest } = options;
  const material = new T.MeshToonMaterial({ color, gradientMap: ramp(), ...rest });
  material.userData.wind = wind;
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windTime;
    if (wind) {
      shader.vertexShader = "uniform float uWindTime;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", windChunk);
    }
    shader.fragmentShader = shader.fragmentShader.replace("#include <opaque_fragment>", "float animeRim=pow(1.0-clamp(dot(normalize(normal),normalize(vViewPosition)),0.0,1.0),3.0);\noutgoingLight+=vec3(0.72,0.49,0.23)*animeRim*" + rim.toFixed(3) + ";\n#include <opaque_fragment>");
  };
  material.customProgramCacheKey = () => "anime-toon-" + wind + "-" + rim;
  return material;
}
export function windyDepth() {
  const m = new T.MeshDepthMaterial({ depthPacking: T.RGBADepthPacking, side: T.DoubleSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uWindTime = windTime;
    shader.vertexShader = "uniform float uWindTime;\n" + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace("#include <begin_vertex>", windChunk);
  };
  return m;
}
export function canvasTexture(size, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d");
  draw(ctx, size);
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
export function glowTexture() {
  return canvasTexture(128, (c, n) => {
    const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    g.addColorStop(0, "rgba(255,255,245,1)");
    g.addColorStop(0.16, "rgba(255,230,156,.95)");
    g.addColorStop(0.43, "rgba(255,142,48,.4)");
    g.addColorStop(1, "rgba(255,97,28,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, n, n);
  });
}
export function smokeTexture() {
  return canvasTexture(128, (c, n) => {
    const g = c.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
    g.addColorStop(0, "rgba(255,255,255,.6)");
    g.addColorStop(0.4, "rgba(255,255,255,.3)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    c.fillStyle = g;
    c.fillRect(0, 0, n, n);
  });
}
export function outlineMaterial() {
  return new T.ShaderMaterial({ side: T.BackSide, uniforms: { ink: { value: new T.Color("#473b40") }, thickness: { value: 12e-4 } }, vertexShader: ["#include <common>", "#include <skinning_pars_vertex>", "uniform float thickness;", "void main(){", "#include <skinbase_vertex>", "#include <beginnormal_vertex>", "#include <skinnormal_vertex>", "#include <begin_vertex>", "#include <skinning_vertex>", "vec4 mvPosition=modelViewMatrix*vec4(transformed,1.0);", "mvPosition.xyz+=normalize(normalMatrix*objectNormal)*thickness;", "gl_Position=projectionMatrix*mvPosition;", "}"].join("\n"), fragmentShader: "uniform vec3 ink;void main(){gl_FragColor=vec4(ink,1.0);\n#include <tonemapping_fragment>\n#include <colorspace_fragment>\n}" });
}
