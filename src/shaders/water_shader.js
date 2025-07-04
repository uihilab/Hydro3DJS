export const waterVertexShader = `
    #include <morphtarget_pars_vertex>
    uniform float time;
    uniform samplerCube envMap;

    varying vec4 worldPosition;
    varying mat4 proj_mat;
    #include <common>
    #include <fog_pars_vertex>
    #include <shadowmap_pars_vertex>
    #include <logdepthbuf_pars_vertex>


    void main() {
        #include <begin_vertex>
		#include <morphtarget_vertex>
        worldPosition = modelMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( transformed, 1.0 );;
        #include <beginnormal_vertex>
        #include <defaultnormal_vertex>
        #include <logdepthbuf_vertex>
        #include <fog_vertex>
        #include <shadowmap_vertex>
    }
`

export const waterFragmentShader = `
uniform samplerCube envMap;
uniform float alpha;
uniform float time;
uniform float size;
uniform float distortionScale;
uniform sampler2D normalSampler;
uniform vec3 sunColor;
uniform vec3 sunDirection;
uniform vec3 eye;
uniform vec3 waterColor;
uniform float shiny;
uniform float spec;
uniform float diffuse;
uniform float rf0;

varying vec4 worldPosition;

vec4 getNoise( vec2 uv ) {
    vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
    vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
    vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
    vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
    vec4 noise = texture2D( normalSampler, uv0 ) +
        texture2D( normalSampler, uv1 ) +
        texture2D( normalSampler, uv2 ) +
        texture2D( normalSampler, uv3 );
    return noise * 0.5 - 1.0;
}
void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, inout vec3 diffuseColor, inout vec3 specularColor ) {
    vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
    float direction = max( 0.0, dot( eyeDirection, reflection ) );
    specularColor += pow( direction, shiny ) * sunColor * spec;
    diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
}
#include <common>
#include <packing>
#include <bsdfs>
#include <fog_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <lights_pars_begin>
#include <shadowmap_pars_fragment>
#include <shadowmask_pars_fragment>
void main() {
    #include <logdepthbuf_fragment>
    vec4 noise = getNoise( worldPosition.xy * size );
    vec3 surfaceNormal = normalize( noise.xyz * vec3( 1.5, 1.0, 1.5 ) );
    vec3 diffuseLight = vec3(0.0);
    vec3 specularLight = vec3(0.0);
    vec3 worldToEye = eye - worldPosition.xyz;
    vec3 eyeDirection = normalize( worldToEye );
    sunLight( surfaceNormal, eyeDirection, diffuseLight, specularLight );
    float distance = length(worldToEye);
    vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
    vec3 reflectionSample = vec3(1.0,1.0,1.0);
    float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
    float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );

    //vec3 worldNormal = inverseTransformDirection( vec3(0.0,0.0,1.0), viewMatrix );
    vec3 _eye = vec3(-10374890.885264954, 3843690.34055224, 1250.56563388561295);
    vec3 worldNormal = normalize(normalize(_eye-worldPosition.xyz)+surfaceNormal);
    vec4 envMapColor = textureCube( envMap, worldNormal.xzy);
    vec3 envColor = PI * envMapColor.rgb/ 3.;
    vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
    vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ), 
                        ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
    vec3 outgoingLight = mix(albedo, envMapColor.xyz, reflectance);
    
    gl_FragColor = vec4( outgoingLight, alpha );

  }
`