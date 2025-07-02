import {UserInterface} from './ui.js'

export var boat1 = new UserInterface({
    pos_x: 300, pos_y: 0, pos_z: 470,
    rot_x: 0, rot_y: 0, rot_z: 0,
    scale: 0.16, visible: true,
    path_a: 5, path_b: 2, vel: 0.1,
})

export var turbine1 = new UserInterface({
    pos_x: -314, pos_y:0, pos_z:632,
    rot_x: 0, rot_y: 1.6, rot_z: 0,
    scale: 9, visible: true
})

export var turbine2 = new UserInterface({
    pos_x: -314, pos_y:0, pos_z:512,
    rot_x: 0, rot_y: 1.6, rot_z: 0,
    scale: 9, visible: true
})

export var turbine3 = new UserInterface({
    pos_x: -314, pos_y:0, pos_z:392,
    rot_x: 0, rot_y: 1.6, rot_z: 0,
    scale: 9, visible: true
})

export var turbine4 = new UserInterface({
    pos_x: -314, pos_y:0, pos_z:752,
    rot_x: 0, rot_y: 1.6, rot_z: 0,
    scale: 9, visible: true
})

export var turbine5 = new UserInterface({
    pos_x: -314, pos_y:0, pos_z:872,
    rot_x: 0, rot_y: 1.6, rot_z: 0,
    scale: 9, visible: true
})

export var bridge1 = new UserInterface({
    pos_x: 1513, pos_y:-1, pos_z:54,
    rot_x: 0, rot_y: 1.74, rot_z: 0,
    scale: 34, visible: true
})

export var dam1 = new UserInterface({
    pos_x: 2323, pos_y:162, pos_z:-339,
    rot_x: 0, rot_y: 1.46, rot_z: 0,
    scale: 2.2, visible: true
})

export var boat2 = new UserInterface({
    pos_x: 218, pos_y:0, pos_z:126,
    rot_x: 0, rot_y: 4.58, rot_z: 0,
    scale: 8, visible: true
})

export var house1 = new UserInterface({
    pos_x: 0, pos_y:0, pos_z:0,
    rot_x: 0, rot_y: 0, rot_z: 0,
    scale: 11, visible: true
})


export var boat3 = new UserInterface({
    pos_x: 298, pos_y:0, pos_z:126,
    rot_x: 0, rot_y: 4.58, rot_z: 0,
    scale: 8, visible: true
})

export var boat4 = new UserInterface({
    pos_x: 298, pos_y:0, pos_z:126,
    rot_x: 0, rot_y: 4.58, rot_z: 0,
    scale: 8, visible: true
})

export var harbor1 = new UserInterface({
    pos_x: 417, pos_y:6, pos_z:136,
    rot_x: Math.PI, rot_y: 0, rot_z: 3.19,
    scale: 1, visible: true
})

export var rain = new UserInterface({
    pos_x: 1100, pos_y:3701, pos_z:30,
    scale: 3430, visible: true,
    vel: 10, num: 4000, is_rain: true,
    wind_x:0, wind_y:0
})

export var island1 = new UserInterface({
    pos_x: 452, pos_y:8, pos_z:435,
    rot_x: 0, rot_y: 2.2, rot_z: 0,
    scale: 0.7, visible: true
})

export var lighthouse1 = new UserInterface({
    pos_x: 1993, pos_y:0, pos_z:574,
    rot_x: 0, rot_y: 0, rot_z: 0,
    scale: 4, visible: true
})

export var house2 = new UserInterface({
    pos_x: 1728, pos_y:-2, pos_z:-452,
    rot_x: 0, rot_y: 3.27, rot_z: 0,
    scale: 21, visible: true
})


export var tornado = new UserInterface({
    pos_x: 1879, pos_y: 113, pos_z: 18,
    rot_x: 0, rot_y: 0, rot_z: 0,
    scale: 26.4, visible: true,
    path_a: 10.7, path_b: 7.1, vel: 0.19,
})

export var water_controls = new UserInterface({
    textSize: 0.3, shiny:22, spec: 1.7, diffuse: 5.1, waterColor: 0x001e0f,
    rf0: 0.13, level:5
})

export function getVariableByName(name)
{
    return eval(name)
}