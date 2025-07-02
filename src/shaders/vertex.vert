uniform float time;

varying vec3 vUV;
varying vec3 vNormal;
varying vec4 mirrorCoord;
varying vec4 worldPosition;

vec3 GerstnerWave(vec4 wave, vec3 pos, inout vec3 normal){
    float k = 2. * 3.1415926 / 2.;
    float q = wave.z/(k * wave.w);
    float c = sqrt(9.8/k);
    float a = wave.w;
    vec2 dir = normalize(wave.xy);
    float cosine = cos(k * dot(dir, pos.xz) + c * time);
    float sine = sin(k * dot(dir,pos.xz) + c * time);

    float x =  q * a * dir.x * cosine;
    float y = a * sin(k*dot(dir,pos.xz) + c * time);
    float z =  q * a * dir.y * cosine;

    float wa = k * a;


    normal -= vec3(dir.x * wa * cosine, 
                    q * wa * sine, 
                    dir.y * wa * cosine);

    return vec3(x,y,z);
}

void main() {
    vNormal = normal;
    vUV = uv;
    vec3 pos = position;
    vec3 w1 = GerstnerWave(vec4(1,1,4,1), pos, vNormal);
    vec4 mvPosition =  modelViewMatrix * vec4( pos+w1, 1.0 );

    gl_Position = projectionMatrix * mvPosition;
}