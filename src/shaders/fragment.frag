const float PI	 	= 3.14159265358;

const float EPSILON	= 1e-3;
#define  EPSILON_NRM	(0.5 / iResolution.x)

const int NUM_STEPS = 6;

const int ITER_GEOMETRY = 2;
const int ITER_FRAGMENT =5;

const float SEA_HEIGHT = 0.5;
const float SEA_CHOPPY = 3.0;
const float SEA_SPEED = 1.9;
const float SEA_FREQ = 0.24;
const vec3 SEA_BASE = vec3(0.11,0.19,0.22);
const vec3 SEA_WATER_COLOR = vec3(0.55,0.9,0.7);
#define SEA_TIME (iTime * SEA_SPEED)

mat2 octave_m = mat2(1.7,1.2,-1.2,1.4);

const float KEY_SP    = 32.5/256.0;

vec3 rgb2hsv(vec3 c)
{
    vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
    vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));

    float d = q.x - min(q.w, q.y);
    float e = 1.0e-10;
    return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
}

vec3 hsv2rgb(vec3 c)
{
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

mat3 fromEuler(vec3 ang) {
	vec2 a1 = vec2(sin(ang.x),cos(ang.x));
    vec2 a2 = vec2(sin(ang.y),cos(ang.y));
    vec2 a3 = vec2(sin(ang.z),cos(ang.z));
    mat3 m;
    m[0] = vec3(a1.y*a3.y+a1.x*a2.x*a3.x,a1.y*a2.x*a3.x+a3.y*a1.x,-a2.y*a3.x);
	m[1] = vec3(-a2.y*a1.x,a1.y*a2.y,a2.x);
	m[2] = vec3(a3.y*a1.x*a2.x+a1.y*a3.x,a1.x*a3.x-a1.y*a3.y*a2.x,a2.y*a3.y);
	return m;
}

float hash( vec2 p ) {
    float h = dot(p,vec2(127.1,311.7));	
    return fract(sin(h)*83758.5453123);
}

float noise( in vec2 p ) {
    vec2 i = floor( p );
    vec2 f = fract( p );	

    vec2 u = f*f*(3.0-2.0*f);

    return -1.0+2.0*mix( 
                mix( hash( i + vec2(0.0,0.0) ), 
                     hash( i + vec2(1.0,0.0) ), 
                        u.x),
                mix( hash( i + vec2(0.0,1.0) ), 
                     hash( i + vec2(1.0,1.0) ), 
                        u.x), 
                u.y);
}


float diffuse(vec3 n,vec3 l,float p) {
    return pow(dot(n,l) * 0.4 + 0.6,p);
}

float specular(vec3 n,vec3 l,vec3 e,float s) {    
    float nrm = (s + 8.0) / (3.1415 * 8.0);
    return pow(max(dot(reflect(e,n),l),0.0),s) * nrm;
}

vec3 getSkyColor(vec3 e) {
    e.y = max(e.y,0.0);
    vec3 ret;
    ret.x = pow(1.0-e.y,2.0);
    ret.y = 1.0-e.y;
    ret.z = 0.6+(1.0-e.y)*0.4;
    return ret;
}

float sea_octave(vec2 uv, float choppy) {
    uv += noise(uv);

    vec2 wv = 1.0-abs(sin(uv)); 

    vec2 swv = abs(cos(uv));  
  
    wv = mix(wv,swv,wv);

    return pow(1.0-pow(wv.x * wv.y,0.65),choppy);
}


float map(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_GEOMETRY; i++) {
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);

        h += d * amp;
        
    	uv *=  octave_m;
        
        freq *= 1.9; 
        amp *= 0.22; 
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}


float map_detailed(vec3 p) {
    float freq = SEA_FREQ;
    float amp = SEA_HEIGHT;
    float choppy = SEA_CHOPPY;
    vec2 uv = p.xz; uv.x *= 0.75;
    
    float d, h = 0.0;    
    for(int i = 0; i < ITER_FRAGMENT; i++) {
    	d = sea_octave((uv+SEA_TIME)*freq,choppy);
    	d += sea_octave((uv-SEA_TIME)*freq,choppy);
        
        h += d * amp; 
        
    	uv *= octave_m/1.2;
        
        freq *= 1.9; 
        amp *= 0.22; 
        choppy = mix(choppy,1.0,0.2);
    }
    return p.y - h;
}


vec3 getSeaColor(vec3 p, vec3 n, vec3 l, vec3 eye, vec3 dist) {  

    float fresnel = 1.0 - max(dot(n,-eye),0.0);
    fresnel = pow(fresnel,3.0) * 0.45;
        
    vec3 reflected = getSkyColor(reflect(eye,n))*0.99;    
    
    vec3 refracted = SEA_BASE + diffuse(n,l,80.0) * SEA_WATER_COLOR * 0.27; 
    
    vec3 color = mix(refracted,reflected,fresnel);
    
    float atten = max(1.0 - dot(dist,dist) * 0.001, 0.0);
    color += SEA_WATER_COLOR * (p.y - SEA_HEIGHT) * 0.15 * atten;
    
    color += vec3(specular(n,l,eye,90.0))*0.5;
    
    return color;
}

vec3 getNormal(vec3 p, float eps) {

    vec3 n;
    n.y = map_detailed(p); 
    n.x = map_detailed(vec3(p.x+eps,p.y,p.z)) - n.y; 
    n.z = map_detailed(vec3(p.x,p.y,p.z+eps)) - n.y; 
    n.y = eps; 
    return normalize(n);
}


float isKeyPressed(float key)
{
	return texture( iChannel1, vec2(key, 1.0) ).x;
}

float heightMapTracing(vec3 ori, vec3 dir, out vec3 p) {  
    float tm = 0.0;
    float tx = 500.0; 

    float hx = map(ori + dir * tx);

    if(hx > 0.0) return tx;   

    float hm = map(ori + dir * tm); 
   
    float tmid = 0.0;
    for(int i = 0; i < NUM_STEPS; i++) {
        
        tmid = mix(tm,tx, hm/(hm-hx));
        p = ori + dir * tmid; 
                  
    	float hmid = map(p); 
        if(hmid < 0.0) { 
            tx = tmid;
            hx = hmid;
        } else {
            tm = tmid;
            hm = hmid;
        }
    }

    return tmid;
}

void mainImage( out vec4 fragColor, in vec2 fragCoord ) {

    vec2 uv = fragCoord.xy / iResolution.xy;

    uv = uv * 2.0 - 1.0; 
    uv.x *= iResolution.x / iResolution.y; 
    float time = iTime * 2.7; // bteitler: Animation is based on time, but allows you to scrub the animation based on mouse movement
        

    // bteitler: Calculated a vector that smoothly changes over time in a sinusoidal (wave) pattern.  
    // This will be used to drive where the user is looking in world space.
   // vec3 ang = vec3(sin(time*3.0)*0.1,sin(time)*0.2+0.3,time);
    float roll = PI + sin(iTime)/14.0 + cos(iTime/2.0)/14.0 ;
    float pitch = PI*1.021 + (sin(iTime/2.0)+ cos(iTime))/40.0 
        + (iMouse.y/iResolution.y - .8)*PI/3.0  ;
    float yaw = iMouse.x/iResolution.x * PI * 4.0;
    vec3 ang = vec3(roll,pitch,yaw);
   // vec3 ang = vec3(roll,pitch,0);
    
    // bteitler: Calculate the "origin" of the camera in world space based on time.  Camera is located
    // at height 3.5 atx 0 (zero), and flies over the ocean in the z axis over time.
    vec3 ori = vec3(0.0,3.5,time*3.0);
   
    // bteitler: This is the ray direction we are shooting from the camera location ("ori") that we need to light
    // for this pixel.  The -2.0 indicates we are using a focal length of 2.0 - this is just an artistic choice and
    // results in about a 90 degree field of view.
    //  CaliCoastReplay :  Adjusted slightly to a lower focal length.  Seems to dramatize the scene.
    vec3 dir = normalize(vec3(uv.xy,-1.6)); 

    // bteitler: Distort the ray a bit for a fish eye effect (if you remove this line, it will remove
    // the fish eye effect and look like a realistic perspective).
   //  dir.z += length(uv) * 0.15;

    // bteitler: Renormalize the ray direction, and then rotate it based on the previously calculated
    // animation angle "ang".  "fromEuler" just calculates a rotation matrix from a vector of angles.
    // if you remove the " * fromEuler(ang)" part, you will disable the camera rotation animation.
    dir = normalize(dir) * fromEuler(ang);
    
    // tracing

    // bteitler: ray-march to the ocean surface (which can be thought of as a randomly generated height map)
    // and store in p
    vec3 p;
    heightMapTracing(ori,dir,p);

    vec3 dist = p - ori; // bteitler: distance vector to ocean surface for this pixel's ray

    // bteitler: Calculate the normal on the ocean surface where we intersected (p), using
    // different "resolution" (in a sense) based on how far away the ray traveled.  Normals close to
    // the camera should be calculated with high resolution, and normals far from the camera should be calculated with low resolution
    // The reason to do this is that specular effects (or non linear normal based lighting effects) become fairly random at
    // far distances and low resolutions and can cause unpleasant shimmering during motion.
    vec3 n = getNormal(p, 
             dot(dist,dist)   // bteitler: Think of this as inverse resolution, so far distances get bigger at an expnential rate
                * EPSILON_NRM // bteitler: Just a resolution constant.. could easily be tweaked to artistic content
           );

    // bteitler: direction of the infinitely far away directional light.  Changing this will change
    // the sunlight direction.
    vec3 light = normalize(vec3(0.0,1.0,0.8)); 
             
    // CaliCoastReplay:  Get the sky and sea colors
	vec3 skyColor = getSkyColor(dir);
    vec3 seaColor = getSeaColor(p,n,light,dir,dist);
    
    //Sea/sky preprocessing
    
    //CaliCoastReplay:  A distance falloff for the sea color.   Drastically darkens the sea, 
    //this will be reversed later based on day/night.
    seaColor /= sqrt(sqrt(length(dist))) ;
    
    
    //CaliCoastReplay:  Day/night mode
    bool night; 	 
    if( isKeyPressed(KEY_SP) > 0.0 )    //night mode!
    {
        //Brighten the sea up again, but not too bright at night
    	seaColor *= seaColor * 8.5;
        
        //Turn down the sky 
    	skyColor /= 1.69;
        
        //Store that it's night mode for later HSV calcc
        night = true;
    }
    else  //day mode!
    {
        //Brighten the sea up again - bright and beautiful blue at day
    	seaColor *= sqrt(sqrt(seaColor)) * 4.0;
        skyColor *= 1.05;
        skyColor -= 0.03;
        night = false;
    }

    
    //CaliCoastReplay:  A slight "constrasting" for the sky to match the more contrasted ocean
    skyColor *= skyColor;
    
    
    //CaliCoastReplay:  A rather hacky manipulation of the high-value regions in the image that seems
    //to add a subtle charm and "sheen" and foamy effect to high value regions through subtle darkening,
    //but it is hacky, and not physically modeled at all.  
    vec3 seaHsv = rgb2hsv(seaColor);
    if (seaHsv.z > .75 && length(dist) < 50.0)
       seaHsv.z -= (0.9 - seaHsv.z) * 1.3;
    seaColor = hsv2rgb(seaHsv);
    
    // bteitler: Mix (linear interpolate) a color calculated for the sky (based solely on ray direction) and a sea color 
    // which contains a realistic lighting model.  This is basically doing a fog calculation: weighing more the sky color
    // in the distance in an exponential manner.
    
    vec3 color = mix(
        skyColor,
        seaColor,
    	pow(smoothstep(0.0,-0.05,dir.y), 0.3) // bteitler: Can be thought of as "fog" that gets thicker in the distance
    );
        
    // Postprocessing
    
    // bteitler: Apply an overall image brightness factor as the final color for this pixel.  Can be
    // tweaked artistically.
    fragColor = vec4(pow(color,vec3(0.75)), 1.0);
    
    // CaliCoastReplay:  Adjust hue, saturation, and value adjustment for an even more processed look
    // hsv.x is hue, hsv.y is saturation, and hsv.z is value
    vec3 hsv = rgb2hsv(fragColor.xyz);    
    //CaliCoastReplay: Increase saturation slightly
    hsv.y += 0.131;
    //CaliCoastReplay:
    //A pseudo-multiplicative adjustment of value, increasing intensity near 1 and decreasing it near
    //0 to achieve a more contrasted, real-world look
    hsv.z *= sqrt(hsv.z) * 1.1; 
    
    if (night)    
    {
    ///CaliCoastReplay:
    //Slight value adjustment at night to turn down global intensity
        hsv.z -= 0.045;
        hsv*=0.8;
        hsv.x += 0.12 + hsv.z/100.0;
        //Highly increased saturation at night op, oddly.  Nights appear to be very colorful
        //within their ranges.
        hsv.y *= 2.87;
    }
    else
    {
      //CaliCoastReplay:
        //Add green tinge to the high range
      //Turn down intensity in day in a different way     
        
        hsv.z *= 0.9;
        
        //CaliCoastReplay:  Hue alteration 
        hsv.x -= hsv.z/10.0;
        hsv.x += 0.02 + hsv.z/50.0;
        //Final brightening
        hsv.z *= 1.01;
        //This really "cinemafies" it for the day -
        //puts the saturation on a squared, highly magnified footing.
        //Worth looking into more as to exactly why.
       // hsv.y *= 5.10 * hsv.y * sqrt(hsv.y);
        hsv.y += 0.07;
    }
    
    //CaliCoastReplay:    
    //Replace the final color with the adjusted, translated HSV values
    fragColor.xyz = hsv2rgb(hsv);
}