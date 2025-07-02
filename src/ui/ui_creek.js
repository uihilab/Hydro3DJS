import {UserInterface} from './ui.js'

export var boat1 = new UserInterface({
    pos_x: 3032, pos_y: 0, pos_z: -426,
    rot_x: 0, rot_y: 0, rot_z: 0,
    scale: 0.16, visible: true,
    path_a: 2.7, path_b: 2.6, vel: 0.13,
})

export var turbine1 = new UserInterface({
    pos_x: 3176, pos_y:0, pos_z:-1028,
    rot_x: 0, rot_y: 5.79, rot_z: 0,
    scale: 9, visible: true
})

export var turbine2 = new UserInterface({
    pos_x: 3305, pos_y:0, pos_z:-964,
    rot_x: 0, rot_y: 5.79, rot_z: 0,
    scale: 9, visible: true
})

export var turbine3 = new UserInterface({
    pos_x: 3429, pos_y:0, pos_z:-908,
    rot_x: 0, rot_y: 5.79, rot_z: 0,
    scale: 9, visible: true
})

export var turbine4 = new UserInterface({
    pos_x: 3546, pos_y:0, pos_z:-854,
    rot_x: 0, rot_y: 5.79, rot_z: 0,
    scale: 9, visible: true
})

export var turbine5 = new UserInterface({
    pos_x: 3673, pos_y:0, pos_z:-792,
    rot_x: 0, rot_y: 5.79, rot_z: 0,
    scale: 9, visible: true
})

export var bridge1 = new UserInterface({
    pos_x: 2088, pos_y:3, pos_z:-614,
    rot_x: 0, rot_y: 3.67, rot_z: 0,
    scale: 37, visible: true
})

export var dam1 = new UserInterface({
    pos_x: 2619, pos_y:272, pos_z:-420,
    rot_x: 0, rot_y: 1.13, rot_z: 0,
    scale: 3.8, visible: true
})

export var boat2 = new UserInterface({
    pos_x: 419, pos_y:0, pos_z:128,
    rot_x: 0, rot_y: 4.24, rot_z: 0,
    scale: 8, visible: true
})

export var house1 = new UserInterface({
    pos_x: 1805, pos_y:0, pos_z:-1414,
    rot_x: 0, rot_y:5.93, rot_z: 0,
    scale: 11, visible: true
})

export var boat3 = new UserInterface({
    pos_x: 483, pos_y:0, pos_z:152,
    rot_x: 0, rot_y:4.24, rot_z: 0,
    scale: 8, visible: true
})

export var boat4 = new UserInterface({
    pos_x: 298, pos_y:0, pos_z:126,
    rot_x: 0, rot_y:4.58, rot_z: 0,
    scale: 8, visible: true
})

export var harbor1 = new UserInterface({
    pos_x: 590, pos_y:6, pos_z:169,
    rot_x: Math.PI, rot_y:0.21, rot_z: 3.19,
    scale: 1, visible: true
})

export var rain = new UserInterface({
    pos_x: 1900, pos_y:3701, pos_z:30,
    scale: 4430, visible: true,
    vel: 10, num: 4000, is_rain: true,
    wind_x:0, wind_y:0
})

export var island1 = new UserInterface({
    pos_x: 1829, pos_y:8, pos_z:-34,
    rot_x: 0, rot_y:2.2, rot_z: 0,
    scale: 0.7, visible: true
})

export var lighthouse1 = new UserInterface({
    pos_x: 1626, pos_y:0, pos_z:574,
    rot_x: 0, rot_y:0, rot_z: 0,
    scale: 4, visible: true
})

export var house2 = new UserInterface({
    pos_x: 1109, pos_y:-2, pos_z:789,
    rot_x: 0, rot_y:0, rot_z: 0,
    scale: 21, visible: true
})

export var tornado = new UserInterface({
    pos_x: 2175, pos_y: 113, pos_z: -521,
    rot_x: 0, rot_y: 0, rot_z: 0,
    scale: 26.4, visible: true,
    path_a: 10.7, path_b: 10, vel: 0.19,
})

export var water_controls = new UserInterface({
    textSize: 0.3, shiny:22, spec: 1.7, diffuse: 5.1, waterColor: 0x001e0f,
    rf0: 0.13, level:1
})


export function getVariableByName(name)
{
    return eval(name)
}