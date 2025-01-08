// Conversion Related Function Which are essential for the the Gcode generation and Svg Generation from the FabricJS 
import tinycolor from "tinycolor2";
import { Converter } from "svg-to-gcode";

const returnObjs = async (objects) => {
    const clonedObjs = await Promise.all(
        objects.map((obj) => {
            if (obj.get('name') !== 'ToolHead' && obj.get('name') !== 'BedSize') {
                return obj.clone()
            }
            return null
        })
    );
    const filteredObjs = clonedObjs.filter(Boolean);

    const newObjs = filteredObjs.flatMap((obj) => {
        if (obj.type === 'group') {
            return obj.removeAll()
        } else {
            return obj
        }
    })
    
    return [...newObjs];
}

export const returnGroupedObjects = async (canvas) => {
    canvas.discardActiveObject();
    canvas.renderAll();
    const objects = await returnObjs(canvas.getObjects());
    return objects.reduce((acc, object) => {
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
            // seekRate: config.seekRate,
            zValue: color.zValue,
            tolerance: 0.1,
            quadrant: 2,
            minimumArea: 2.5,
            bedSize: {
                width: 420,
                height: 297
            }
        }

        // console.log('Element From to convertToGcode : ', element.svg)
        const converter = new Converter(settings);
        const [ code ] = await converter.convert(element.svg);
        const gCodeLines = code.split('\n');

        // console.log('From NPM :',gCodeLines)
        const filteredGcodes = gCodeLines.filter(command => command !== `G1 F${config.feedRate}`);

        const cleanedGcodeLines = filteredGcodes.slice(0, -1);
        // cleanedGcodeLines.splice(0, 4);
        cleanedGcodeLines.splice(1, 1);

        return color.penPick.join('\n') + '\n' + cleanedGcodeLines.join('\n') + color.penDrop.join('\n');
    }));

    return [
        // '$H', 
        // 'G53 X0Y0',
        // 'G0 X380Y380',
        // 'G10 L20 P0 X0 Y0 Z0', 
        `G0 F${config.jogSpeed}`,
        `G1 F${config.feedRate} `, 
        ...gcodes, 
        'G53 X-400Y300'
    ]
}
