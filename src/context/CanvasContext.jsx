/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { FabricObject, Canvas, util } from "fabric";
import { selectAllObject, group, deleteObject, copyObject, pasteObject } from "../util/functions";

const CanvasContext = createContext(null);

export default function useCanvas() {
    return useContext(CanvasContext);
}

export const CanvasProvider = ({ children }) => {
    const canvasRef = useRef(null);
    const plotterRef = useRef(null)
    const [ canvas, setCanvas ] = useState(null);
    const [ objectValues, setObjectValues ] = useState({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotateAngle: 0 });
    const [ copiedObject, setCopiedObject ] = useState(null);
    const [ canvasConfig, setCanvasConfig ] = useState({
        width: 300,
        height: 300,
        orientation: 'vertical',
        maxWidth: 330,
        maxHeight: 430
    })
    const toolRef = useRef('Select')
    const [ undoStack, setUndoStack ] = useState([])
    const [ redoStack, setRedoStack ] = useState([])
    
    // let undoStack = [];
    // let redoStack = [];
    let isUndoRedo = false;

    useEffect(() => {
        FabricObject.ownDefaults.cornerStyle = 'circle';
        FabricObject.ownDefaults.cornerColor = '#7f77eb85';
        FabricObject.ownDefaults.transparentCorners = false;
        FabricObject.ownDefaults.cornerSize = 15;
        FabricObject.ownDefaults.borderScaleFactor = 3;
        FabricObject.ownDefaults.noScaleCache = true;
        FabricObject.ownDefaults.strokeUniform = true;
        FabricObject.customProperties = ['name'];
        // FabricObject.ownDefaults.centeredRotation = true;

         
        const fabricCanvas = new Canvas(canvasRef.current, {
            width: util.parseUnit(`${ canvasConfig.width }mm`),
            height: util.parseUnit(`${ canvasConfig.height }mm`),
            backgroundColor: "white",
            fireRightClick: true,
            stopContextMenu: true,
            centeredRotation: true,
        });
        fabricCanvas.renderAll()

        setCanvas(fabricCanvas);
        return () => fabricCanvas.dispose();
    }, []);

    useEffect(() => {
        if (!canvas) return;

        const updateObjectVals = () => {
            const activeObject = canvas.getActiveObject();
            if (activeObject) {
                const x = parseFloat(activeObject.left.toFixed(2));
                const y = parseFloat(activeObject.top.toFixed(2));
                const scaleX = parseFloat(activeObject.scaleX.toFixed(2));
                const scaleY = parseFloat(activeObject.scaleY.toFixed(2));
                const angle = parseFloat(activeObject.angle.toFixed(2));

                setObjectValues({ x: x, y: y, scaleX: scaleX, scaleY: scaleY, rotateAngle: angle });
            }
        }

        canvas.on('object:modified', updateObjectVals);
        return () => canvas.off('object:modified', updateObjectVals);
    }, [canvas]);

    useEffect(() => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();

        if (activeObject) {
            activeObject.set({
                left: objectValues.x, 
                top: objectValues.y, 
                scaleX: objectValues.scaleX, 
                scaleY: objectValues.scaleY, 
                angle: objectValues.rotateAngle
            })
            canvas.renderAll();
        }

    }, [canvas, objectValues]);

    // const saveState = () => {
    //     if (isUndoRedo) return;
    //     // redoStack = [];
    //     console.log('State Triggered :: ', undoStack)
    //     const currentState = JSON.stringify(canvas);
    //     undoStack.push(currentState);
    //     if (undoStack.length > 25) undoStack.shift()
    // }
    const saveState = () => {
        if (isUndoRedo) return;
        setRedoStack([]);

        setUndoStack((prev) => {
            const currentState = JSON.stringify(canvas);
            const newStack = [ ...prev, currentState ];
            if (newStack.length > 25) newStack.shift();
            return newStack;
        });
    }

    useEffect(() => {
        console.log('UndoStack :', undoStack)
        console.log('RedoStack :', redoStack)
    }, [ undoStack, redoStack ])

    // const undo = () => {
    //     if (undoStack.length > 1) {
    //         const currentState = undoStack.pop();
    //         redoStack.push(currentState)
    //         isUndoRedo = true

    //         canvas.loadFromJSON(undoStack[undoStack.length - 1]).then(() => {
    //             const object = canvas.getObjects().find(obj => obj.name === 'ToolHead');
    //             if (object) {
    //                 object.set({
    //                     selectable: false
    //                 })
    //             }
    //             if (toolRef.current === 'Lines') {
    //                 canvas.getObjects().forEach(obj => {
    //                     obj.set({
    //                         selectable: false
    //                     });
    //                 });
    //             }
    //             canvas.renderAll();
    //             isUndoRedo = false;
    //         })
    //     }
    // }
    const undo = () => {
        console.log('Undo RAN INITIAL');
        setUndoStack((prevStack) => {
            if (prevStack.length > 1) {
                const currentState = prevStack.pop();
                setRedoStack((prev) => [...prev, currentState]);
                isUndoRedo = true;
                console.log('Undo RAN')

                canvas.loadFromJSON(prevStack[prevStack.length - 1]).then(() => {
                    const object = canvas.getObjects().find(obj => obj.name === 'ToolHead');
                    if (object) {
                        object.set({
                            selectable: false
                        })
                    }
                    if (toolRef.current === 'Lines') {
                        canvas.getObjects().forEach(obj => {
                            obj.set({
                                selectable: false
                            });
                        });
                    }
                    canvas.renderAll();
                    isUndoRedo = false;
                });

                return [...prevStack]
            }
            return prevStack;
        })
    }

    // const redo = () => {
    //     if (redoStack.length > 0) {
    //         const stateToRedo = redoStack.pop();
    //         undoStack.push(stateToRedo);
    //         isUndoRedo = true
            
    //         canvas.loadFromJSON(stateToRedo).then(() => {
    //             const object = canvas.getObjects().find(obj => obj.name === 'ToolHead');
    //             if (object) {
    //                 object.set({
    //                     selectable: false
    //                 })
    //             }
    //             if (toolRef.current === 'Lines') {
    //                 canvas.getObjects().forEach(obj => {
    //                     obj.set({
    //                         selectable: false
    //                     });
    //                 });
    //             }
    //             canvas.renderAll();
    //             isUndoRedo = false;
    //         })
    //     }
    // }
    const redo = () => {
        setRedoStack((prevStack) => {
            if (prevStack.length > 0) {
                const stateToRedo = prevStack.pop();
                setUndoStack((prev) => [...prev, stateToRedo]);
                isUndoRedo = true
                
                canvas.loadFromJSON(stateToRedo).then(() => {
                    const object = canvas.getObjects().find(obj => obj.name === 'ToolHead');
                    if (object) {
                        object.set({
                            selectable: false
                        })
                    }
                    if (toolRef.current === 'Lines') {
                        canvas.getObjects().forEach(obj => {
                            obj.set({
                                selectable: false
                            });
                        });
                    }
                    canvas.renderAll();
                    isUndoRedo = false;
                });
                return [ ...prevStack ]
            }
            return prevStack;
        });
    }
    
    useEffect(() => {
        if (!canvas) return ;

        saveState()

        canvas.on('object:added', saveState);
        canvas.on('object:modified', saveState);
        canvas.on('object:removed', saveState);

        return () => {
            canvas.off('object:added', saveState);
            canvas.off('object:modified', saveState);
            canvas.off('object:removed', saveState);
        }
    }, [canvas])

    useEffect(() => {
        const handleKey = (e) => {
            const keyStroke = e.key.toLowerCase();
            if (e.ctrlKey && keyStroke === 'c') {
                copyObject(setCopiedObject, canvas);
            } else if (e.ctrlKey && keyStroke === 'v') {
                pasteObject(copiedObject, canvas);
            } else if (keyStroke === 'delete') {
                deleteObject(canvas);
            } else if (e.ctrlKey && keyStroke === 'a') {
                selectAllObject(canvas);
                e.preventDefault();
            } else if (e.ctrlKey && keyStroke === 'g') {
                group(canvas);
                e.preventDefault();
            } else if (e.ctrlKey && keyStroke === 'z') {
                undo()
                e.preventDefault();
            } else if (e.ctrlKey && keyStroke === 'y') {
                redo()
                e.preventDefault();
            }
        }

        // window.addEventListener('keydown', handleKeyDown( copiedObject, setCopiedObject, canvas, undo, redo ));
        window.addEventListener('keydown', handleKey);

        return () => { 
            window.removeEventListener('keydown', handleKey);
        };
    }, [canvas, copiedObject]);

    return (
        <CanvasContext.Provider 
            value={{ 
                canvas, 
                canvasRef,
                canvasConfig, 
                setCanvasConfig,
                objectValues, 
                setObjectValues, 
                saveState,
                toolRef,
                plotterRef
            }}
        >
            { children }
        </CanvasContext.Provider>
    );
};

