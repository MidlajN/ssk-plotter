/* eslint-disable no-undef */
import { comma } from 'postcss/lib/list';
import ReactDOMServer from 'react-dom/server'

/**
 * Handles the uploaded file, loads SVG content, and adds it to the canvas.
 *
 * @param {File} file - The file to be handled
 * @return {void} 
 */
export const handleFile = (file, canvas) => {
    if (file && file.type !== 'image/svg+xml') return;
  
    const reader = new FileReader();
    reader.onload = (e) => {
        const svg = e.target.result;
    
        fabric.loadSVGFromString(svg, (objects, options) => {
            const obj = fabric.util.groupSVGElements(objects, options);
            console.log("Svg from file -->> \n",objects, options, obj)

            // Set styles after object is loaded
            obj.set({ selectable: true, hasControls: true, strokeWidth: 1, stroke: '#fff', fill: '#fff' });

            canvas.add(obj);
            canvas.renderAll();
        });
    };
    reader.readAsText(file);
};
  

/**
 * Splits the active object into individual paths and creates separate fabric paths for each.
 * If the active object is a group, it converts it to an active selection
 * and removes the original group object.
 *
 * @return {void} No return value
 */
export const split = (canvas) => {
    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.get('type') === 'activeSelection') return;

    
    if (activeObject.get('type') === 'group') {
        activeObject.toActiveSelection();
        canvas.remove(activeObject);
    } else {
        if (activeObject.path) {
            const mainArray = [];
            const paths = activeObject.path;
            let array = [];
            let fabricPaths = [];

            const multipleMFound = () => {
                let firstMFound = false;
                for (let path of paths) {
                    if (path[0] === 'M' && path.length === 3) {
                        if (firstMFound) {
                            return true;
                        } else {
                            firstMFound = true;
                        }
                    }
                }
                return false;
            }

            if (multipleMFound()) {
                for (let i = 0; i <= paths.length; i++) {
                    const line = paths[i] ? paths[i].join(' ') : null;
                    const command = paths[i] ? paths[i][0] : null;
    
                    if (command === 'M' || i === paths.length) {
                        if (array.length) mainArray.push(array.join(' '));
                        array = []
                    }
                    array.push(line);
                }
                for (let i = 0; i < mainArray.length; i++) {
                    if (mainArray[i] !== null) {
                        const fabricPath = new fabric.Path(mainArray[i]);
                        fabricPath.set({
                            selectable: true,
                            hasControls: true,
                            fill: 'transparent',
                            stroke: 'black',
                            strokeWidth: 0.4,
                        });
                        fabricPaths.push(fabricPath);
                    }
                }
            } else {
                let lastX = 0;
                let lastY = 0;
                for (let i = 0; i < paths.length; i++) {
                    const command = paths[i][0];
                    let newLine = '';
            
                    if (command === 'M') {
                        // Move command (start new contour)
                        lastX = paths[i][1];
                        lastY = paths[i][2];
                        newLine = `M ${lastX} ${lastY}`;
                    } else {
                        newLine = `M ${lastX} ${lastY} ${paths[i].join(' ')}`;
                        lastX = paths[i][paths[i].length - 2];
                        lastY = paths[i][paths[i].length - 1];
                    }
            
                    // Create new Fabric.js path
                    const fabricPath = new fabric.Path(newLine);
                    fabricPath.set({
                        selectable: true,
                        hasControls: true,
                        fill: 'transparent',
                        stroke: 'black',
                        strokeWidth: 0.4,
                    });
                    fabricPaths.push(fabricPath);
                }
            }

            


            console.log('Paths : ', paths)
            // for (let i = 0; i <= paths.length; i++) {
            //     const line = paths[i] ? paths[i].join(' ') : null;
            //     const command = paths[i] ? paths[i][0] : null;

            //     if (command === 'M' || i === paths.length) {
            //         if (array.length) mainArray.push(array.join(' '));
            //         array = []
            //     }
            //     array.push(line);
            // }
            
            // let lastX = 0;
            // let lastY = 0;
            // for (let i = 0; i < paths.length; i++) {
            //     const command = paths[i][0];
            //     let newLine = '';
        
            //     if (command === 'M') {
            //         // Move command (start new contour)
            //         lastX = paths[i][1];
            //         lastY = paths[i][2];
            //         newLine = `M ${lastX} ${lastY}`;
            //     } else {
            //         newLine = `M ${lastX} ${lastY} ${paths[i].join(' ')}`;
            //         lastX = paths[i][paths[i].length - 2];
            //         lastY = paths[i][paths[i].length - 1];
            //     }
        
            //     // Create new Fabric.js path
            //     const fabricPath = new fabric.Path(newLine);
            //     fabricPath.set({
            //         selectable: true,
            //         hasControls: true,
            //         fill: 'transparent',
            //         stroke: 'black',
            //         strokeWidth: 0.4,
            //     });
            //     fabricPaths.push(fabricPath);
            // }

            // let fabricPaths = [];
            // for (let i = 0; i < mainArray.length; i++) {
            //     if (mainArray[i] !== null) {
            //         const fabricPath = new fabric.Path(mainArray[i]);
            //         fabricPath.set({
            //             selectable: true,
            //             hasControls: true,
            //             fill: 'transparent',
            //             stroke: 'black',
            //             strokeWidth: 0.4,
            //         });
            //         fabricPaths.push(fabricPath);
            //     }
            // }

            const selection = new fabric.ActiveSelection(fabricPaths, { canvas: canvas });
            selection.set({
                top: activeObject.top,
                left: activeObject.left,
                scaleX: activeObject.scaleX,
                scaleY: activeObject.scaleY,
                angle: activeObject.angle
            });

            console.log('Selection : ', selection)
            canvas.discardActiveObject();
            selection.toActiveSelection();
            canvas.remove(activeObject);
        } else {
            console.log('The Element is not a PATH : ', activeObject);
        }
    }
    canvas.renderAll();
}


/**
 * Function to group selected objects together.
 */
export const group = (canvas) => {
    const activeObject = canvas.getActiveObject();
    if (!activeObject || activeObject.get('type') !== 'activeSelection') return;
    activeObject.toGroup();
    canvas.renderAll();
}


/**
 * Copies the active object on the canvas.
 *
 * @param {Function} setCopiedObject - A function to set the copied object.
 */
export const copyObject = (setCopiedObject, canvas) => {
    if (canvas) {
        const activeObject = canvas.getActiveObject();
        if (activeObject) {
            activeObject.clone((clonedObject) => {
                canvas.discardActiveObject();
                setCopiedObject(clonedObject);
                console.log('Object copied', );
            });
        } else {
            console.log('No object selected to copy');
        }
    }
};


/**
 * Function to paste the copied object onto the canvas.
 *
 * @param {Object} copiedObject - The object to be pasted.
 * @return {void} 
 */
export const pasteObject = (copiedObject, canvas) => {

    if (copiedObject) {
        copiedObject.clone((clonedObject) => {

            clonedObject.set({
                left: clonedObject.left + 10,
                top: clonedObject.top + 10,
                evented: true,
            });

            if (clonedObject.get('type') === 'activeSelection') {
                clonedObject.canvas = canvas;
                clonedObject.forEachObject((obj) => {
                    canvas.add(obj);
                });
                clonedObject.setCoords();
            } else {
                canvas.add(clonedObject);
            }
            
            copiedObject.top += 10;
            copiedObject.left += 10;
            canvas.setActiveObject(clonedObject);
            canvas.requestRenderAll();
        });
    } else {
        return
    }
};


/**
 * Deletes the active object on the canvas if present.
 */
export const deleteObject = (canvas) => {
    if (canvas && canvas.getActiveObject()) {
        const activeObject = canvas.getActiveObject();
        if (activeObject.get('type') === 'activeSelection') {
            activeObject.forEachObject((obj) => {
                canvas.remove(obj);
            });
        } else {
            canvas.remove(activeObject);
        }
        canvas.discardActiveObject();
        canvas.requestRenderAll();
    }
}


/**
 * A function to select all objects on the canvas.
 */
export const selectAllObject = (canvas) => {
    if (!canvas) return;
    if (['tool', 'Elements', 'Pen', 'Plot'].includes(canvas.mode)) return;

    canvas.discardActiveObject();
    const objects = canvas.getObjects().filter(obj => obj.get('name') !== 'ToolHead');
    const selection = new fabric.ActiveSelection(objects, { canvas: canvas });
    canvas.setActiveObject(selection);
    canvas.requestRenderAll();
}


export const handleKeyDown = ( copiedObject, setCopiedObject, canvas ) => (e) => {
    if (e.ctrlKey && e.key === 'c') {
        copyObject(setCopiedObject, canvas);
    } else if (e.ctrlKey && e.key === 'v') {
        pasteObject(copiedObject, canvas);
    } else if (e.key === 'Delete') {
        deleteObject(canvas);
    } else if (e.ctrlKey && e.key === 'a') {
        selectAllObject(canvas);
        e.preventDefault();
    } else if (e.ctrlKey && e.key === 'g') {
        group(canvas);
        e.preventDefault();
    } else if (e.ctrlKey && e.key === 'z') {
        canvas.undo();
        e.preventDefault();
    } else if (e.ctrlKey && e.key === 'y') {
        canvas.redo();
        e.preventDefault();
    }
};

export const info = (canvas) => {
    if (!canvas && !canvas.getActiveObject()) return;
    const activeObject = canvas.getActiveObject();
    console.log('SVG ::: ', activeObject.toSVG())
    canvas.renderAll();
}

export const componentToUrl = (Component, rotationAngle = 0) => {
    let svgString = ReactDOMServer.renderToStaticMarkup(<Component size={20} strokeWidth={1.5} color={'#4b5563'}  />)
    svgString = svgString.replace(
        '<svg ',
        `<svg transform="rotate(${rotationAngle})" `
      );

    const blob = new Blob([svgString], { type: 'image/svg+xml'});
    const url = URL.createObjectURL(blob);

    return url
}
