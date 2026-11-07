// Rebuild the small, local SVG atlas from attributed public geographic data.
// node scripts/prepare-landing-map.mjs (network access required; no packages).
import { mkdir, writeFile } from "node:fs/promises";

const source = "https://raw.githubusercontent.com/HabtamuTesafaye/ethiopia-geo-boundaries/main/geojson/eth-adm1-hdx.json";
async function read(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} downloading ${url}`);
  return response.json();
}
const boundaries = await read(source);
if (boundaries.features.length !== 14) throw new Error("Expected 12 regions and 2 city administrations.");
const rings = (geometry) => geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();

function simplify(points, tolerance = 0.012) {
  if (points.length < 4) return points;
  const first = points[0], last = points.at(-1);
  let max = 0, at = 0;
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i], dx = last[0] - first[0], dy = last[1] - first[1];
    const t = Math.max(0, Math.min(1, ((x-first[0])*dx+(y-first[1])*dy)/(dx*dx+dy*dy || 1)));
    const distance = Math.hypot(x-first[0]-t*dx, y-first[1]-t*dy);
    if (distance > max) { max = distance; at = i; }
  }
  return max > tolerance ? [...simplify(points.slice(0,at+1),tolerance).slice(0,-1), ...simplify(points.slice(at),tolerance)] : [first,last];
}

const all = boundaries.features.flatMap(f => rings(f.geometry).flat());
const minX = Math.min(...all.map(p => p[0])), maxX = Math.max(...all.map(p => p[0]));
const minY = Math.min(...all.map(p => p[1])), maxY = Math.max(...all.map(p => p[1]));
const scale = Math.min(550 / ((maxX-minX)*Math.cos(10*Math.PI/180)), 430/(maxY-minY));
const mapPoint = ([lon,lat]) => [300+(lon-(maxX+minX)/2)*Math.cos(10*Math.PI/180)*scale,260-(lat-(maxY+minY)/2)*scale];
const path = (points, project) => points.map((p,i) => `${i ? "L" : "M"}${project(p).map(v => v.toFixed(1)).join(",")}`).join("")+"Z";
const regions = boundaries.features.map(feature => {
  const shape = rings(feature.geometry);
  const largest = [...shape].sort((a,b)=>b.length-a.length)[0];
  const center = mapPoint(largest.reduce((sum,p)=>[sum[0]+p[0]/largest.length,sum[1]+p[1]/largest.length],[0,0]));
  return {id:feature.properties.adm1_pcode,name:feature.properties.adm1_name,
    path:shape.map(r=>path(simplify(r),mapPoint)).join(""), center:center.map(n=>+n.toFixed(1))};
});
const data = {source, license:"CC BY-IGO, OCHA/HDX", represented:"2025-01-01", regions};
await mkdir(new URL("../src/components/landing-ui/", import.meta.url),{recursive:true});
await writeFile(new URL("../src/components/landing-ui/map-data.json",import.meta.url),JSON.stringify(data));
console.log(`Prepared ${regions.length} regions, ${Math.round(JSON.stringify(data).length/1024)} KB`);
