import { fabric } from "fabric";

export const createHexagon = (center, radius) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
        points.push({
            x: center.x + radius * Math.cos((Math.PI / 3) * i),
            y: center.y + radius * Math.sin((Math.PI / 3) * i),
        });
    }

    return new fabric.Polygon(points, {
        fill: 'yellow',
        stroke: 'black',
        strokeWidth: 2,
        selectable: true,
        objectCaching: false,
    });
};


export const prebuiltComponents = {
    rectangle: new fabric.Rect({
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 3,
    }),
    circle: new fabric.Ellipse({
        rx: 0,
        ry: 0,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth:3,
    }),
    triangle: new fabric.Triangle({
        width: 0,
        height: 0,
        fill: 'transparent',
        stroke: 'black',
        strokeWidth: 3,
    }),
};
  
