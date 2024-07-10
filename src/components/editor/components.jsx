import { fabric } from "fabric";

const createHexagon = (center, radius) => {
    const points = [];
    for (let i = 0; i < 6; i++) {
        points.push({
            x: center.x + radius * Math.cos((Math.PI / 3) * i),
            y: center.y + radius * Math.sin((Math.PI / 3) * i),
        });
    }

    console.log('NEW OBJECT : ', points)
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
    hexagon: new fabric.Polygon(
        [
            { x: 200, y: 10 },
            { x: 250, y: 50 },
            { x: 250, y: 100 },
            { x: 200, y: 150 },
            { x: 150, y: 100 },
            { x: 150, y: 50 }
        ],
        {
           fill: "red",
           left: 140,
           top: 10,
        }
     )
};
  

