attribute vec2 a_position;
varying vec2 v_texCoord;

void main(){
  gl_Position=vec4(a_position,0,1);
  v_texCoord=(a_position+1.)/2.;// Map from [-1, 1] to [0, 1]
}
