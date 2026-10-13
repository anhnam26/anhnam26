import * as T from '../../public/vendor/three.module.js';

const geometries=new Map(),materials=new Map();
export function material(color,metalness=0,roughness=.7,emissive=null) {
  const key=[color,metalness,roughness,emissive].join('/');
  if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,metalness,roughness,
    ...(emissive?{emissive,emissiveIntensity:1.3}:{})}));
  return materials.get(key);
}
export function geometry(kind) {
  if(!geometries.has(kind))geometries.set(kind,kind==='box'?new T.BoxGeometry(1,1,1)
    :kind==='sphere'?new T.SphereGeometry(1,20,14)
    :kind==='capsule'?new T.CapsuleGeometry(.5,1,5,12)
    :kind==='cone'?new T.ConeGeometry(1,1,4)
    :new T.CylinderGeometry(1,1,1,12));
  return geometries.get(kind);
}
export function part(parent,kind,size,position,mat,rotation=[0,0,0]) {
  const mesh=new T.Mesh(geometry(kind),mat);
  mesh.scale.set(...size);mesh.position.set(...position);mesh.rotation.set(...rotation);
  mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
export function box(parent,size,pos,mat,rot) {return part(parent,'box',size,pos,mat,rot);}
export function orb(parent,size,pos,mat,rot) {return part(parent,'sphere',size,pos,mat,rot);}

// Static buildings share draw calls instead of rendering hundreds of wall pieces.
export class Blocks {
  constructor(parent) {this.parent=parent;this.batches=new Map();}
  add(size,pos,mat,rotation=[0,0,0]) {
    const items=this.batches.get(mat)??[];items.push({size,pos,rotation});this.batches.set(mat,items);
  }
  finish() {
    const transform=new T.Object3D();
    for(const [mat,items] of this.batches) {
      const batch=new T.InstancedMesh(geometry('box'),mat,items.length);
      items.forEach((item,i)=>{
        transform.position.set(...item.pos);transform.scale.set(...item.size);transform.rotation.set(...item.rotation);
        transform.updateMatrix();batch.setMatrixAt(i,transform.matrix);
      });
      batch.castShadow=batch.receiveShadow=true;this.parent.add(batch);
    }
  }
}
