import {UserInterface} from './ui.js'

export var boat1 = new UserInterface({
    pos_x: 928, pos_y: 0, pos_z: 924,
    rot_x: 0, rot_y: 0, rot_z: 0,
    scale: 0.16, visible: true,
    path_a: 1.7, path_b: 1.8, vel: 0.13,
})

export var turbine1 = new UserInterface({
    pos_x: 98, pos_y:0, pos_z:440,
    rot_x: 0, rot_y: 1.6, rot_z: 0,
    scale: 9, visible: true
})

export var turbine2 = new UserInterface({
    pos_x: 147, pos_y:0, pos_z:572,
    rot_x: 0, rot_y: 1.94, rot_z: 0,
    scale: 9, visible: true
})

export var turbine3 = new UserInterface({
    pos_x: 199, pos_y:0, pos_z:706,
    rot_x: 0, rot_y: 1.94, rot_z: 0,
    scale: 9, visible: true
})

export var turbine4 = new UserInterface({
    pos_x: 3546, pos_y:0, pos_z:-854,
    rot_x: 0, rot_y: 5.79, rot_z: 0,
    scale: 9, visible: false
})

export var turbine5 = new UserInterface({
    pos_x: 3546, pos_y:0, pos_z:-854,
    rot_x: 0, rot_y: 5.79, rot_z: 0,
    scale: 9, visible: false
})

export var bridge1 = new UserInterface({
    pos_x: 853, pos_y:3, pos_z:1405,
    rot_x: 0, rot_y: 2.33, rot_z: 0,
    scale: 49, visible: true
})

export var dam1 = new UserInterface({
    pos_x: 2619, pos_y:272, pos_z:-420,
    rot_x: 0, rot_y: 1.13, rot_z: 0,
    scale: 3.8, visible: false
})


export var boat2 = new UserInterface({
    pos_x: 844, pos_y:0, pos_z:468,
    rot_x: 0, rot_y: 3.88, rot_z: 0,
    scale: 8, visible: true
})

export var house1 = new UserInterface({
    pos_x: 844, pos_y:0, pos_z:468,
    rot_x: 0, rot_y: 3.88, rot_z: 0,
    scale: 11, visible: false
})

export var boat3 = new UserInterface({
    pos_x: 789, pos_y:0, pos_z:417,
    rot_x: 0, rot_y: 3.74, rot_z: 0,
    scale: 8, visible: true
})

export var boat4 = new UserInterface({
    pos_x: 298, pos_y:0, pos_z:126,
    rot_x: 0, rot_y: 4.58, rot_z: 0,
    scale: 8, visible: true
})

export var harbor1 = new UserInterface({
    pos_x: 914, pos_y:6, pos_z:538,
    rot_x: Math.PI, rot_y: 0.84, rot_z: 3.19,
    scale: 1, visible: true
})

export var rain = new UserInterface({
    pos_x: 800, pos_y:3701, pos_z:887,
    scale: 2530, visible: true,
    vel: 10, num: 4000, is_rain: true,
    wind_x:0, wind_y:0
})


export var island1 = new UserInterface({
    pos_x: 667, pos_y:8, pos_z:626,
    rot_x: 0, rot_y: 2.2, rot_z: 0,
    scale: 0.7, visible: true
})

export var lighthouse1 = new UserInterface({
    pos_x: 1626, pos_y:0, pos_z:574,
    rot_x: 0, rot_y: 0, rot_z: 0,
    scale: 4, visible: false
})

export var house2 = new UserInterface({
    pos_x: 1415, pos_y:-2, pos_z:789,
    rot_x: 0, rot_y: 2.15, rot_z: 0,
    scale: 21, visible: true
})

export var tornado = new UserInterface({
    pos_x: 2175, pos_y: 113, pos_z: -521,
    rot_x: 0, rot_y: 0, rot_z: 0,
    scale: 26.4, visible: false,
    path_a: 10, path_b: 10, vel: 0.19,
})

export var water_controls = new UserInterface({
    textSize: 0.3, shiny:22, spec: 1.7, diffuse: 5.1, waterColor: 0x001e0f,
    rf0: 0.13, level:1
})

export function getVariableByName(name)
{
    return eval(name)
}