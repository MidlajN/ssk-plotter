// Conversion Related Function Which are essential for the the Gcode generation and Svg Generation from the FabricJS 
import tinycolor from "tinycolor2";
import { Converter } from "svg-to-gcode";

// TO FIX 
const returnObjs = (objects) => {
    const newObjects = []

    // const processObject = (object, transformMatrix = null) => {
    //     if (object.get('type') ===  'group') {
    //         object.getObjects().forEach(innerObject => {
    //             processObject(innerObject, object.calcTransformMatrix())
    //         });
    //     } else {
    //         object.clone(clonedObject => {
    //             if (transformMatrix) {
    //                 const originalLeft = clonedObject.left;
    //                 const originalTop = clonedObject.top;

    //                 clonedObject.set({
    //                     left: originalLeft * transformMatrix[0] + originalTop * transformMatrix[2] + transformMatrix[4],
    //                     top: originalLeft * transformMatrix[1] + originalTop * transformMatrix[3] + transformMatrix[5],
    //                     angle: clonedObject.angle + object.angle,
    //                     scaleX: clonedObject.scaleX * object.scaleX,
    //                     scaleY: clonedObject.scaleY * object.scaleY
    //                 })
    //             }
    //             newObjects.push(clonedObject);
    //         })  
    //     }
    // }

    objects.forEach(obj => {
        if (obj.get('name') !== 'ToolHead') {
            // console.log(obj.toSVG());
            // processObject(obj)
            newObjects.push(obj)
        }
    })

    return newObjects
}

export const returnGroupedObjects = (canvas) => {
    // const objects = returnObjs(canvas.getObjects());

    return returnObjs(canvas.getObjects()).reduce((acc, object) => {
        const stroke = tinycolor(object.stroke).toHexString();
        acc[stroke] = acc[stroke] || [];
        // if (!acc[stroke]) acc[stroke] = [];
        acc[stroke].push(object)
        return acc
    }, {});
}


export const returnSvgElements = (objects, width, height) => {
    const svgElements = []

    for (const stroke in objects) {
        let groupSVG = '';
        if (objects[stroke].length > 1) {

            objects[stroke].forEach(obj => {
                const svg = obj.toSVG();
                console.log('SVG FROM G : ', svg);
                groupSVG += svg;
            });
        } else {
            const svg = objects[stroke][0].toSVG()
            groupSVG += svg
        }

        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', `0 0 ${ width } ${ height }`);
        svg.innerHTML = groupSVG;

        const data = {
            color : stroke,
            svg : svg.outerHTML
        }
        console.log('Svg to Be PUSHED :', svg)
        svgElements.push(data);
    }

    return svgElements
}

export const sortSvgElements = (svgElements, colors) => {
    const colorOrder = colors.reduce((acc, colorObject, index) => {
        acc[colorObject.color] = index
        return acc
    }, {});

    svgElements.sort((a, b) => colorOrder[a.color] - colorOrder[b.color]);
}


export const convertToGcode = async (svgElements, colors, config) => {
    const gcodes = await Promise.all(svgElements.map( async (element) => {
        const color = colors.find(objects => objects.color === element.color);

        let settings = {
            zOffset: config.zOffset,
            feedRate: config.feedRate,
            seekRate: config.seekRate,
            zValue: color.zValue,
            tolerance: 0.1
        }

        console.log('Element From to convertToGcode : ', element.svg)
        const converter = new Converter(settings);
        const [ code ] = await converter.convert(element.svg);
        const gCodeLines = code.split('\n');

        const filteredGcodes = gCodeLines.filter(command => command !== `G1 F${config.feedRate}`);

        const cleanedGcodeLines = filteredGcodes.slice(0, -1);
        cleanedGcodeLines.splice(0, 4);
        cleanedGcodeLines.splice(1, 1);

        return color.command + '\n' + cleanedGcodeLines.join('\n');
    }));

    return ['$H', 'G10 L20 P0 X0 Y0 Z0', `G1 F${config.feedRate}`, 'G0 X50Y50\n', ...gcodes, 'G0 X680Y540']
}
