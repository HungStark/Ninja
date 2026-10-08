import * as T from "three";
export function createHandModel() {
  const model = new T.Group();
  model.name = "AnimeNinjaHand";
  const root = new T.Bone();
  root.name = "wrist";
  model.add(root);
  const bones = [root];
  const vertices = [], normals = [], uv = [], indices = [], skinIndices = [], skinWeights = [];
  function addVertex(p, n, tex, joints = [0, 0, 0, 0], weights = [1, 0, 0, 0]) {
    vertices.push(...p);
    normals.push(...n);
    uv.push(...tex);
    skinIndices.push(...joints);
    skinWeights.push(...weights);
  }
  const profile = [[-0.13, 0.025, 0.022], [-0.115, 0.045, 0.028], [-0.08, 0.059, 0.034], [-0.03, 0.071, 0.039], [0.035, 0.073, 0.036], [0.08, 0.066, 0.031], [0.1, 0.057, 0.025], [0.114, 0.033, 0.015], [0.117, 2e-3, 2e-3]];
  for (let row = 0; row < profile.length; row++) {
    const [y, rx, rz] = profile[row];
    for (let j = 0; j <= 24; j++) {
      const a = j / 24 * Math.PI * 2;
      addVertex([Math.cos(a) * rx, y, Math.sin(a) * rz], [Math.cos(a), 0, Math.sin(a)], [j / 24, row / (profile.length - 1)]);
      if (row < profile.length - 1 && j < 24) {
        const i = row * 25 + j;
        indices.push(i, i + 1, i + 26, i, i + 26, i + 25);
      }
    }
  }
  function addFinger(name, base, length, radius, restZ = 0) {
    const j0 = new T.Bone();
    j0.name = name + "_0";
    j0.position.fromArray(base);
    j0.rotation.z = restZ;
    root.add(j0);
    const j1 = new T.Bone();
    j1.name = name + "_1";
    j1.position.y = length * 0.46;
    j0.add(j1);
    const j2 = new T.Bone();
    j2.name = name + "_2";
    j2.position.y = length * 0.31;
    j1.add(j2);
    const ids = [bones.length, bones.length + 1, bones.length + 2];
    bones.push(j0, j1, j2);
    const start = vertices.length / 3, segments = 14, rows = 20;
    for (let row = 0; row <= rows; row++) {
      const t = row / rows, y = t * length;
      let a = 0, b = 0, w = 0;
      if (t < 0.34) {
        a = ids[0];
        b = ids[0];
      } else if (t < 0.58) {
        a = ids[0];
        b = ids[1];
        w = (t - 0.34) / 0.24;
      } else if (t < 0.67) {
        a = ids[1];
        b = ids[1];
      } else if (t < 0.87) {
        a = ids[1];
        b = ids[2];
        w = (t - 0.67) / 0.2;
      } else {
        a = ids[2];
        b = ids[2];
      }
      const tip = Math.sqrt(Math.max(8e-3, 1 - Math.pow(Math.max(0, (t - 0.88) / 0.12), 2))), r = radius * (1 - 0.22 * t) * tip;
      for (let j = 0; j <= segments; j++) {
        const angle = j / segments * Math.PI * 2, x = Math.cos(angle) * r, z = Math.sin(angle) * r * 0.88, ca = Math.cos(restZ), sa = Math.sin(restZ), p = [base[0] + ca * x - sa * y, base[1] + sa * x + ca * y, base[2] + z], n = [ca * Math.cos(angle), sa * Math.cos(angle), Math.sin(angle)];
        addVertex(p, n, [j / segments, t], [a, b, 0, 0], [1 - w, w, 0, 0]);
        if (row < rows && j < segments) {
          const i = start + row * (segments + 1) + j;
          indices.push(i, i + 1, i + segments + 2, i, i + segments + 2, i + segments + 1);
        }
      }
    }
    const nail = new T.Mesh(new T.SphereGeometry(1, 12, 8), new T.MeshStandardMaterial({ color: 16308159, roughness: 0.55 }));
    nail.name = name + "_nail";
    nail.scale.set(radius * 0.63, length * 0.055, 25e-4);
    nail.position.set(0, length * 0.155, radius * 0.69);
    j2.add(nail);
  }
  addFinger("index", [-0.048, 0.081, 0], 0.137, 0.0175);
  addFinger("middle", [-0.014, 0.101, 0], 0.157, 0.018);
  addFinger("ring", [0.022, 0.096, 0], 0.145, 0.017);
  addFinger("little", [0.053, 0.07, 0], 0.111, 0.0143);
  addFinger("thumb", [-0.063, -0.024, 0], 0.104, 0.021, 0.92);
  const geo = new T.BufferGeometry();
  geo.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  geo.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  geo.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  geo.setAttribute("skinIndex", new T.Uint16BufferAttribute(skinIndices, 4));
  geo.setAttribute("skinWeight", new T.Float32BufferAttribute(skinWeights, 4));
  for (let i = 0; i < indices.length; i += 3) {
    const b = indices[i + 1];
    indices[i + 1] = indices[i + 2];
    indices[i + 2] = b;
  }
  geo.setIndex(indices);
  geo.computeVertexNormals();
  const skin = new T.SkinnedMesh(geo, new T.MeshStandardMaterial({ name: "skin", color: 15976613, roughness: 0.85 }));
  skin.name = "hand_skin";
  model.add(skin);
  model.updateMatrixWorld(true);
  skin.bind(new T.Skeleton(bones));
  const cloth = new T.MeshStandardMaterial({ name: "cloth", color: 2177357, roughness: 0.9 });
  const trim = new T.MeshStandardMaterial({ name: "trim", color: 14990968, roughness: 0.5 });
  const glove = new T.MeshStandardMaterial({ name: "glove", color: 3165019, roughness: 0.85 });
  function staticMesh(geometry, material, p, s, name) {
    const mesh = new T.Mesh(geometry, material);
    mesh.name = name;
    mesh.position.fromArray(p);
    mesh.scale.fromArray(s);
    root.add(mesh);
    return mesh;
  }
  const sleeveProfile = [new T.Vector2(0.063, -0.47), new T.Vector2(0.061, -0.42), new T.Vector2(0.055, -0.34), new T.Vector2(0.052, -0.25), new T.Vector2(0.047, -0.14)];
  staticMesh(new T.LatheGeometry(sleeveProfile, 24), cloth, [0, 0, 0], [1, 1, 0.8], "sleeve");
  staticMesh(new T.CylinderGeometry(0.05, 0.052, 0.046, 24), glove, [0, -0.14, 0], [1, 1, 0.88], "wrist_cuff");
  for (let y of [-0.118, -0.164]) staticMesh(new T.TorusGeometry(0.049, 3e-3, 6, 28), trim, [0, y, 0], [1, 0.88, 1], "gold_binding").rotation.x = Math.PI / 2;
  staticMesh(new T.SphereGeometry(1, 20, 16), glove, [0, -0.032, 0.032], [0.071, 0.072, 0.013], "glove_back");
  const plate = staticMesh(new T.SphereGeometry(1, 16, 12), trim, [0, -0.025, 0.046], [0.038, 0.042, 4e-3], "wrist_plate");
  staticMesh(new T.SphereGeometry(1, 12, 8), glove, [0, -0.023, 0.05], [0.03, 0.034, 2e-3], "plate_inset");
  const rune = staticMesh(new T.TorusGeometry(0.011, 18e-4, 4, 12), trim, [0, -0.021, 0.052], [1, 1, 1], "chakra_rune");
  staticMesh(new T.CylinderGeometry(14e-4, 14e-4, 0.026, 6), trim, [0, -0.022, 0.054], [1, 1, 1], "chakra_line").rotation.z = 0.35;
  for (let side of [-1, 1]) {
    staticMesh(new T.CylinderGeometry(2e-3, 2e-3, 0.22, 6), trim, [side * 0.043, -0.29, 0.028], [1, 1, 1], "sleeve_seam").rotation.z = side * 0.015;
    const tie = staticMesh(new T.CapsuleGeometry(6e-3, 0.075, 3, 8), cloth, [side * 0.045, -0.19, 0.015], [1, 1, 0.5], "cloth_tie");
    tie.rotation.z = side * 0.4;
  }
  return model;
}
