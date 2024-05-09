import React, { useEffect, useRef } from "react";
import vertexShaderSource from "../shaders/vertex.glsl";
import fragmentShaderSource from "../shaders/fragment.glsl";

export default function Canvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl") as WebGLRenderingContext;
    if (!gl) {
      console.error("WebGL isn't supported in this browser.");
      return;
    }

    // console.log("WebGL context acquired successfully.");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
      // console.log(`Viewport set to: ${canvas.width} x ${canvas.height}`);
    };
    window.addEventListener("resize", resize);
    resize();

    // Initialize shaders
    const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = createShader(
      gl,
      gl.FRAGMENT_SHADER,
      fragmentShaderSource,
    );
    if (!vertexShader || !fragmentShader) {
      // console.error("Failed to create shaders.");
      return;
    }

    const program = createProgram(gl, vertexShader, fragmentShader);
    if (!program) {
      // console.error("Failed to create shader program.");
      return;
    }

    gl.useProgram(program);
    // console.log("Shader program created and used successfully.");

    // Create and bind buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    const positions = [-1, -1, 1, -1, -1, 1, 1, 1];
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
    // console.log("Position buffer created and data bound.");

    const positionLocation = gl.getAttribLocation(program, "a_position");
    if (positionLocation === -1) {
      // console.error("Failed to get attribute location for a_position.");
      return;
    }

    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    // console.log("Attribute 'a_position' enabled and pointer configured.");

    // Get uniform locations
    const stateLocation = gl.getUniformLocation(program, "u_state");
    const textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    if (!stateLocation || !textureSizeLocation) {
      // console.error("Failed to get uniform locations.");
      return;
    }

    // Setup grid size
    const gridSize = [canvas.width, canvas.height];
    const [textureA, textureB] = [createTexture(gl), createTexture(gl)];
    initializeTexture(gl, textureA, gridSize);
    initializeTexture(gl, textureB, gridSize);

    // Create framebuffer
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

    // Set uniform values
    gl.uniform2fv(textureSizeLocation, gridSize);

    function render(currentTexture: WebGLTexture, nextTexture: WebGLTexture) {
      // Set up for rendering to the next texture
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        nextTexture,
        0,
      );

      if (
        gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE
      ) {
        // console.error("Framebuffer is incomplete.");
        return;
      }

      // Set uniform values
      gl.uniform1i(stateLocation, 0);

      // Bind the current texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, currentTexture);

      // Draw to the framebuffer
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Render the framebuffer to the screen
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // Swap the textures for the next frame
      requestAnimationFrame(() => render(nextTexture, currentTexture));
    }

    render(textureA, textureB);

    return () => window.removeEventListener("resize", resize);
  }, []);

  function createShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string,
  ) {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Shader creation failed");

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      // console.error(`Error compiling shader: ${gl.getShaderInfoLog(shader)}`);
      gl.deleteShader(shader);
      return null;
    }

    // console.log(
    //   `${type === gl.VERTEX_SHADER ? "Vertex" : "Fragment"} shader compiled successfully.`,
    // );
    return shader;
  }

  function createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
  ) {
    const program = gl.createProgram();
    if (!program) throw new Error("Program creation failed");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      // console.error(`Error linking program: ${gl.getProgramInfoLog(program)}`);
      gl.deleteProgram(program);
      return null;
    }

    // console.log("Program linked successfully.");
    return program;
  }

  function createTexture(gl: WebGLRenderingContext) {
    const texture = gl.createTexture() as WebGLTexture;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    return texture;
  }

  function initializeTexture(
    gl: WebGLRenderingContext,
    texture: WebGLTexture,
    size: number[],
  ) {
    const [width, height] = size;
    const initialState = new Uint8Array(width * height * 4);

    for (let i = 0; i < width * height; i++) {
      const value = Math.random() > 0.5 ? 255 : 0;
      initialState[i * 4 + 0] = value; // Red channel
      initialState[i * 4 + 1] = value; // Green channel
      initialState[i * 4 + 2] = value; // Blue channel
      initialState[i * 4 + 3] = 255; // Alpha channel
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      width,
      height,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      initialState,
    );
  }

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none z-0 min-h-screen w-full select-none"
    />
  );
}
