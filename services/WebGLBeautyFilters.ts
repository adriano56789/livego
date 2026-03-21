// Shaders e filtros de beleza avançados para WebGL
// Implementação de algoritmos profissionais de embelezamento

export interface ShaderConfig {
  name: string;
  vertexSource: string;
  fragmentSource: string;
  uniforms: string[];
}

export class WebGLBeautyFilters {
  private gl: WebGLRenderingContext | null = null;
  private programs: Map<string, WebGLProgram> = new Map();
  
  constructor(gl: WebGLRenderingContext) {
    this.gl = gl;
    this.initializeShaders();
  }

  /**
   * Inicializar todos os shaders de beleza
   */
  private initializeShaders(): void {
    const shaders: ShaderConfig[] = [
      this.getSkinSmoothingShader(),
      this.getSkinWhiteningShader(),
      this.getFaceDetectionShader(),
      this.getBeautyEnhancementShader()
    ];

    shaders.forEach(shader => {
      const program = this.compileProgram(shader.vertexSource, shader.fragmentSource);
      if (program) {
        this.programs.set(shader.name, program);
        console.log(`✅ [WEBGL_FILTERS] Shader "${shader.name}" compilado`);
      } else {
        console.error(`❌ [WEBGL_FILTERS] Falha ao compilar "${shader.name}"`);
      }
    });
  }

  /**
   * Shader de suavização de pele (skin smoothing)
   */
  private getSkinSmoothingShader(): ShaderConfig {
    return {
      name: 'skinSmoothing',
      vertexSource: `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `,
      fragmentSource: `
        precision mediump float;
        
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        uniform float u_smoothing;
        uniform float u_strength;
        
        varying vec2 v_texCoord;
        
        void main() {
          vec2 uv = v_texCoord;
          uv.y = 1.0 - uv.y;
          
          vec4 color = texture2D(u_texture, uv);
          
          if (u_smoothing > 0.0) {
            vec2 texelSize = 1.0 / u_resolution;
            float radius = u_smoothing * 3.0;
            vec3 blurred = vec3(0.0);
            float totalWeight = 0.0;
            
            // Kernel gaussiano para blur mais natural
            for (float x = -radius; x <= radius; x += 1.0) {
              for (float y = -radius; y <= radius; y += 1.0) {
                vec2 offset = vec2(x, y) * texelSize;
                float dist = length(vec2(x, y));
                float weight = exp(-(dist * dist) / (2.0 * u_smoothing * u_smoothing));
                
                vec3 sample = texture2D(u_texture, uv + offset).rgb;
                blurred += sample * weight;
                totalWeight += weight;
              }
            }
            
            blurred /= totalWeight;
            
            // Detecção de pele simplificada
            vec3 hsv = rgb2hsv(color.rgb);
            bool isSkin = hsv.x > 0.0 && hsv.x < 0.15 && hsv.y > 0.1 && hsv.y < 0.7 && hsv.z > 0.2;
            
            if (isSkin) {
              color.rgb = mix(color.rgb, blurred, u_strength);
            }
          }
          
          gl_FragColor = color;
        }
        
        // Funções auxiliares
        vec3 rgb2hsv(vec3 c) {
          vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
          
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }
      `,
      uniforms: ['u_texture', 'u_resolution', 'u_smoothing', 'u_strength']
    };
  }

  /**
   * Shader de branqueamento de pele (skin whitening)
   */
  private getSkinWhiteningShader(): ShaderConfig {
    return {
      name: 'skinWhitening',
      vertexSource: `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `,
      fragmentSource: `
        precision mediump float;
        
        uniform sampler2D u_texture;
        uniform float u_whitening;
        uniform float u_preserve;
        
        varying vec2 v_texCoord;
        
        void main() {
          vec2 uv = v_texCoord;
          uv.y = 1.0 - uv.y;
          
          vec4 color = texture2D(u_texture, uv);
          
          if (u_whitening > 0.0) {
            // Converter para YUV para processamento mais preciso
            float y = 0.299 * color.r + 0.587 * color.g + 0.114 * color.b;
            float u = -0.14713 * color.r - 0.28886 * color.g + 0.436 * color.b;
            float v = 0.615 * color.r - 0.51499 * color.g - 0.10001 * color.b;
            
            // Aumentar luminância (branqueamento)
            y = mix(y, 1.0, u_whitening * 0.3);
            
            // Preservar um pouco da cor original para look natural
            u = mix(u, 0.0, u_whitening * u_preserve);
            v = mix(v, 0.0, u_whitening * u_preserve);
            
            // Converter de volta para RGB
            float r = y + 1.13983 * v;
            float g = y - 0.39465 * u - 0.58060 * v;
            float b = y + 2.03211 * u;
            
            color = vec4(r, g, b, color.a);
          }
          
          gl_FragColor = color;
        }
      `,
      uniforms: ['u_texture', 'u_whitening', 'u_preserve']
    };
  }

  /**
   * Shader de detecção facial (face detection)
   */
  private getFaceDetectionShader(): ShaderConfig {
    return {
      name: 'faceDetection',
      vertexSource: `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `,
      fragmentSource: `
        precision mediump float;
        
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        uniform float u_threshold;
        
        varying vec2 v_texCoord;
        
        void main() {
          vec2 uv = v_texCoord;
          uv.y = 1.0 - uv.y;
          
          vec4 color = texture2D(u_texture, uv);
          
          // Detecção de tons de pele (simplificada)
          vec3 rgb = color.rgb;
          float maxVal = max(max(rgb.r, rgb.g), rgb.b);
          float minVal = min(min(rgb.r, rgb.g), rgb.b);
          float delta = maxVal - minVal;
          
          bool isSkin = false;
          
          if (delta > 0.001) {
            float h = 0.0;
            if (maxVal == rgb.r) {
              h = 60.0 * ((rgb.g - rgb.b) / delta + (rgb.g < rgb.b ? 6.0 : 0.0));
            } else if (maxVal == rgb.g) {
              h = 60.0 * ((rgb.b - rgb.r) / delta + 2.0);
            } else {
              h = 60.0 * ((rgb.r - rgb.g) / delta + 4.0);
            }
            
            float s = delta / maxVal;
            float v = maxVal;
            
            // Faixa de tons de pele (HSV)
            isSkin = (h >= 0.0 && h <= 25.0) || (h >= 335.0 && h <= 360.0);
            isSkin = isSkin && s >= 0.1 && s <= 0.7;
            isSkin = isSkin && v >= 0.2 && v <= 0.95;
          }
          
          // Output: skin mask
          gl_FragColor = vec4(isSkin ? 1.0 : 0.0, 0.0, 0.0, 1.0);
        }
      `,
      uniforms: ['u_texture', 'u_resolution', 'u_threshold']
    };
  }

  /**
   * Shader de enhancement geral de beleza
   */
  private getBeautyEnhancementShader(): ShaderConfig {
    return {
      name: 'beautyEnhancement',
      vertexSource: `
        attribute vec2 a_position;
        attribute vec2 a_texCoord;
        varying vec2 v_texCoord;
        
        void main() {
          gl_Position = vec4(a_position, 0.0, 1.0);
          v_texCoord = a_texCoord;
        }
      `,
      fragmentSource: `
        precision mediump float;
        
        uniform sampler2D u_texture;
        uniform vec2 u_resolution;
        uniform vec4 u_beautyParams; // x: whitening, y: smoothing, z: saturation, w: contrast
        uniform float u_time;
        
        varying vec2 v_texCoord;
        
        void main() {
          vec2 uv = v_texCoord;
          uv.y = 1.0 - uv.y;
          
          vec4 original = texture2D(u_texture, uv);
          vec3 color = original.rgb;
          
          // 1. Whitening (branqueamento)
          if (u_beautyParams.x > 0.0) {
            float luminance = dot(color, vec3(0.299, 0.587, 0.114));
            vec3 gray = vec3(luminance);
            color = mix(color, gray, u_beautyParams.x * 0.3);
          }
          
          // 2. Smoothing (suavização)
          if (u_beautyParams.y > 0.0) {
            vec2 texelSize = 1.0 / u_resolution;
            float radius = u_beautyParams.y * 2.0;
            vec3 blurred = vec3(0.0);
            float total = 0.0;
            
            // Bilateral filter simplificado
            for (float x = -radius; x <= radius; x += 1.0) {
              for (float y = -radius; y <= radius; y += 1.0) {
                vec2 offset = vec2(x, y) * texelSize;
                vec3 sample = texture2D(u_texture, uv + offset).rgb;
                float dist = length(vec2(x, y));
                float weight = exp(-(dist * dist) / (2.0 * u_beautyParams.y));
                
                // Preservar bordas
                float edgeFactor = 1.0 / (1.0 + abs(dot(color - sample, vec3(1.0))));
                weight *= edgeFactor;
                
                blurred += sample * weight;
                total += weight;
              }
            }
            
            blurred /= total;
            
            // Detectar pele para aplicar smoothing seletivo
            float skinFactor = detectSkin(color);
            color = mix(color, blurred, skinFactor * u_beautyParams.y * 0.5);
          }
          
          // 3. Saturation (saturação/rubor)
          if (u_beautyParams.z > 0.0) {
            float gray = dot(color, vec3(0.299, 0.587, 0.114));
            color = mix(vec3(gray), color, 1.0 + u_beautyParams.z * 0.5);
          }
          
          // 4. Contrast (contraste)
          if (u_beautyParams.w > 0.0) {
            color = (color - 0.5) * (1.0 + u_beautyParams.w * 0.5) + 0.5;
          }
          
          // 5. Subtle glow effect
          if (u_beautyParams.x > 0.3) {
            float glow = u_beautyParams.x * 0.1;
            color += vec3(glow * 0.1, glow * 0.05, glow * 0.02);
          }
          
          gl_FragColor = vec4(color, original.a);
        }
        
        // Função auxiliar de detecção de pele
        float detectSkin(vec3 color) {
          vec3 hsv = rgb2hsv(color);
          float h = hsv.x;
          float s = hsv.y;
          float v = hsv.z;
          
          // Faixa de tons de pele em HSV
          bool skinHue = (h >= 0.0 && h <= 0.15) || (h >= 0.95);
          bool skinSat = s >= 0.1 && s <= 0.7;
          bool skinVal = v >= 0.2 && v <= 0.95;
          
          return skinHue && skinSat && skinVal ? 1.0 : 0.0;
        }
        
        // Conversão RGB para HSV
        vec3 rgb2hsv(vec3 c) {
          vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
          vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
          vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
          
          float d = q.x - min(q.w, q.y);
          float e = 1.0e-10;
          return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
        }
      `,
      uniforms: ['u_texture', 'u_resolution', 'u_beautyParams', 'u_time']
    };
  }

  /**
   * Compilar programa WebGL
   */
  private compileProgram(vertexSource: string, fragmentSource: string): WebGLProgram | null {
    if (!this.gl) return null;

    const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER);
    const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER);

    if (!vertexShader || !fragmentShader) return null;

    const program = this.gl.createProgram();
    if (!program) return null;

    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);

    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      console.error('❌ [WEBGL_FILTERS] Link error:', this.gl.getProgramInfoLog(program));
      this.gl.deleteProgram(program);
      return null;
    }

    return program;
  }

  /**
   * Compilar shader individual
   */
  private compileShader(source: string, type: number): WebGLShader | null {
    if (!this.gl) return null;

    const shader = this.gl.createShader(type);
    if (!shader) return null;

    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);

    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('❌ [WEBGL_FILTERS] Shader error:', this.gl.getShaderInfoLog(shader));
      this.gl.deleteShader(shader);
      return null;
    }

    return shader;
  }

  /**
   * Obter programa pelo nome
   */
  getProgram(name: string): WebGLProgram | null {
    return this.programs.get(name) || null;
  }

  /**
   * Aplicar filtro específico
   */
  applyFilter(
    filterName: string,
    texture: WebGLTexture,
    targetTexture: WebGLTexture,
    uniforms: Record<string, any>
  ): boolean {
    const program = this.getProgram(filterName);
    if (!program || !this.gl) return false;

    this.gl.useProgram(program);

    // Configurar uniforms
    Object.entries(uniforms).forEach(([name, value]) => {
      const location = this.gl!.getUniformLocation(program, name);
      if (location) {
        if (typeof value === 'number') {
          this.gl!.uniform1f(location, value);
        } else if (value instanceof Array) {
          if (value.length === 2) {
            this.gl!.uniform2f(location, value[0], value[1]);
          } else if (value.length === 4) {
            this.gl!.uniform4f(location, value[0], value[1], value[2], value[3]);
          }
        }
      }
    });

    // Renderizar com o filtro
    this.renderQuad();

    return true;
  }

  /**
   * Renderizar quad fullscreen
   */
  private renderQuad(): void {
    if (!this.gl) return;

    // Configurar geometria (quad)
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    const texCoords = new Float32Array([
      0, 0,
      1, 0,
      0, 1,
      1, 1,
    ]);

    // Position buffer
    const positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);

    const positionLocation = this.gl.getAttribLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), 'a_position');
    this.gl.enableVertexAttribArray(positionLocation);
    this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Texture coordinate buffer
    const texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, texCoords, this.gl.STATIC_DRAW);

    const texCoordLocation = this.gl.getAttribLocation(this.gl.getParameter(this.gl.CURRENT_PROGRAM), 'a_texCoord');
    this.gl.enableVertexAttribArray(texCoordLocation);
    this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 0, 0);

    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Limpar recursos
   */
  destroy(): void {
    if (this.gl) {
      this.programs.forEach(program => {
        this.gl!.deleteProgram(program);
      });
      this.programs.clear();
    }
  }
}
