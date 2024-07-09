import { fabric } from "fabric";

export const prebuiltComponents = {
    rectangle: new fabric.Rect({
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 3,
    }),
    circle: new fabric.Circle({
        radius: 10,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth:3,
    }),
    triangle: new fabric.Triangle({
        width: 50,
        height: 50,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 3,
    }),
};
  

