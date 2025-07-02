export class UserInterface {
    constructor({pos_x=null, pos_y=null, pos_z=null, rot_x=null, rot_y=null, 
        rot_z=null, scale=null, visible=null, 
        path_a=null, path_b=null, vel=null,
        num=null, is_rain=null, wind_x=null, wind_y=null,
        textSize=null, shiny=null, spec=null, diffuse=null, waterColor=null, rf0=null, level=null}){
        this.pos_x = pos_x
        this.pos_y = pos_y
        this.pos_z = pos_z
        this.rot_x = rot_x
        this.rot_y = rot_y
        this.rot_z = rot_z
        this.scale = scale
        this.visible = visible
        //path
        this.path_a = path_a
        this.path_b = path_b
        this.vel = vel
        //rain
        this.num = num
        this.is_rain = is_rain
        this.wind_x = wind_x
        this.wind_y = wind_y
        //water shader
        this.textSize = textSize
        this.shiny = shiny
        this.spec = spec
        this.diffuse = diffuse
        this.waterColor = waterColor
        this.rf0 = rf0
        this.level = level
    }
}
