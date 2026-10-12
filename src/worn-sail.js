import * as T from 'three';

const bulge = (x, y) => .2 * Math.cos(x) * Math.cos(y);

// Subdivide the triangulated cloth while keeping shared vertices for smooth normals.
function clothGeometry(shape, subdivisions = 2) {
  const original = new T.ShapeGeometry(shape);
  let points = Array.from({ length: original.attributes.position.count }, (_, i) => [original.attributes.position.getX(i), original.attributes.position.getY(i)]);
  let indices = Array.from(original.index.array);
  original.dispose();
  for (let level = 0; level < subdivisions; level++) {
    const edges = new Map(), next = [];
    const midpoint = (a, b) => {
      const key = a < b ? `${a}/${b}` : `${b}/${a}`;
      if (!edges.has(key)) {
        edges.set(key, points.length);
        points.push([(points[a][0] + points[b][0]) / 2, (points[a][1] + points[b][1]) / 2]);
      }
      return edges.get(key);
    };
    for (let i = 0; i < indices.length; i += 3) {
      const [a, b, c] = indices.slice(i, i + 3), ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      next.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    indices = next;
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(points.flatMap(([x, y]) => [x, y, bulge(x, y)]), 3));
  geometry.setAttribute('uv', new T.Float32BufferAttribute(points.flatMap(([x, y]) => [(x + 1.45) / 2.9, (y + 1.3) / 2.6]), 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function polygon(points) {
  const shape = new T.Shape();
  points.forEach(([x, y], i) => i ? shape.lineTo(x, y) : shape.moveTo(x, y));
  shape.closePath();
  return shape;
}

export function wornSailGeometry() {
  const shape = polygon([
    [-1.45, 1.3], [1.45, 1.3], [1.45, .82], [1.29, .72], [1.44, .60],
    [1.45, -.70], [1.25, -.89], [1.30, -1.18], [.97, -1.24], [.82, -.93],
    [.69, -1.25], [.20, -1.30], [.05, -1.12], [-.09, -1.28], [-.68, -1.24],
    [-.78, -.99], [-.92, -1.25], [-1.32, -1.15], [-1.45, -.93], [-1.45, -.20],
    [-1.30, -.08], [-1.45, .05],
  ]);
  for (const [x, y, width, height] of [[1.00, .38, .15, .23], [-.95, -.52, .11, .16]]) {
    const hole = new T.Path();
    for (let i = 0; i < 9; i++) {
      const angle = i / 9 * Math.PI * 2, r = i % 2 ? .80 : 1;
      const px = x + Math.cos(angle) * width * r, py = y + Math.sin(angle) * height * r;
      if (i) hole.lineTo(px, py); else hole.moveTo(px, py);
    }
    hole.closePath(); shape.holes.push(hole);
  }
  return clothGeometry(shape);
}

export function wornFlagGeometry() {
  return clothGeometry(polygon([[-.425, .2], [.425, .17], [.23, .03], [.39, -.06], [.18, -.13], [.30, -.2], [-.425, -.2]]), 1);
}

export function sailPatchGeometry(face) {
  const geometry = clothGeometry(polygon([[-1.19, .44], [-.77, .40], [-.74, .84], [-1.16, .89]]), 1);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + face * .012);
  return geometry;
}

export function sailStitchesGeometry(face) {
  const points = [];
  for (let i = 0; i < 4; i++) {
    const x = -1.12 + i * .09;
    for (const y of [.45, .84]) {
      points.push(x, y - .026, bulge(x, y - .026) + face * .017);
      points.push(x + .018, y + .026, bulge(x + .018, y + .026) + face * .017);
    }
  }
  const geometry = new T.BufferGeometry();
  geometry.setAttribute('position', new T.Float32BufferAttribute(points, 3));
  return geometry;
}
