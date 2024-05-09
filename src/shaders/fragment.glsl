precision mediump float;

varying vec2 v_texCoord;
uniform sampler2D u_state;
uniform vec2 u_textureSize;

int getState(vec2 offset){
  vec2 coord=mod(v_texCoord*u_textureSize+offset,u_textureSize);
  return int(texture2D(u_state,coord/u_textureSize).r+.5);
}

void main(){
  int currentState=getState(vec2(0,0));
  int neighbors=getState(vec2(-1,-1))+getState(vec2(-1,0))+getState(vec2(-1,1))+
  getState(vec2(0,-1))+getState(vec2(0,1))+
  getState(vec2(1,-1))+getState(vec2(1,0))+getState(vec2(1,1));
  
  int nextState=currentState;
  if(currentState==1&&(neighbors<2||neighbors>3)){
    nextState=0;// Die due to underpopulation or overpopulation
  }else if(currentState==0&&neighbors==3){
    nextState=1;// New cell due to reproduction
  }
  
  gl_FragColor=vec4(float(nextState),float(nextState),float(nextState),1.);
}
