import * as T from '../../public/vendor/three.module.js';

// Blend two independently rendered scenes; never insert a blank frame or video.
export class LoopBlend {
  constructor(renderer) {
    this.renderer=renderer;
    this.a=new T.WebGLRenderTarget(1,1);this.b=new T.WebGLRenderTarget(1,1);
    this.a.texture.colorSpace=this.b.texture.colorSpace=T.SRGBColorSpace;
    this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-1,1,1,-1,0,1);
    this.material=new T.ShaderMaterial({depthTest:false,depthWrite:false,
      uniforms:{a:{value:this.a.texture},b:{value:this.b.texture},blend:{value:0}},
      vertexShader:'varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader:'uniform sampler2D a;uniform sampler2D b;uniform float blend;varying vec2 uvScreen;void main(){gl_FragColor=mix(texture2D(a,uvScreen),texture2D(b,uvScreen),blend);\n#include <colorspace_fragment>\n}',
    });
    this.scene.add(new T.Mesh(new T.PlaneGeometry(2,2),this.material));
  }
  resize(w,h) {this.a.setSize(w,h);this.b.setSize(w,h);}
  render(drawEnding,drawOpening,weight) {
    this.renderer.setRenderTarget(this.a);drawEnding();
    this.renderer.setRenderTarget(this.b);drawOpening();
    this.renderer.setRenderTarget(null);this.material.uniforms.blend.value=weight;
    this.renderer.render(this.scene,this.camera);
  }
}
