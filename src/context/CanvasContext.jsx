/* eslint-disable no-unused-vars */
/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
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
    const [ canvasObjs, setCanvasObjs ] = useState(null)
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

        if (!canvasRef.current) return;

        const fabricCanvas = new Canvas(canvasRef.current, {
            width: util.parseUnit(`${ canvasConfig.width }mm`),
            height: util.parseUnit(`${ canvasConfig.height }mm`),
            backgroundColor: 'white',
            fireRightClick: true,
            stopContextMenu: true,
            centeredRotation: true,
        });

        const savedCanvas = localStorage.getItem('fabricCanvas');
        if (savedCanvas) {
            console.log('SavedState : ', savedCanvas);
            fabricCanvas.loadFromJSON(JSON.parse(savedCanvas), fabricCanvas.renderAll.bind(fabricCanvas)).then(() => {
                setCanvasObjs([...fabricCanvas.getObjects()])
            });
        }

        setCanvas(fabricCanvas);

        const saveCanvasState = () => {
            const canvasState = fabricCanvas.toJSON();
            localStorage.setItem('fabricCanvas', JSON.stringify(canvasState));
        };

        window.addEventListener('beforeunload', saveCanvasState);

        return () => {
            window.removeEventListener('beforeunload', saveCanvasState);
            fabricCanvas.dispose();
        };
    }, []);

    useEffect(() => {
        if (!canvas) return;
        console.log('Canvas State : ', canvas.toJSON());
    }, [canvas])

    const saveState = useCallback(() => {
        if (isUndoRedo) return;
        setRedoStack([]);
        canvas.renderAll();
        setUndoStack((prev) => {
            const currentState = JSON.stringify(canvas);
            console.log('Current State ', JSON.parse(currentState))
            const newStack = [ ...prev, currentState ];
            if (newStack.length > 25) newStack.shift();
            return newStack;
        });
    }, [canvas, setRedoStack, setUndoStack])

    const undo = () => {
        setUndoStack((prevStack) => {
            if (prevStack.length > 1) {
                const updatedStack = [ ...prevStack ]
                const currentState = updatedStack.pop();
                setRedoStack((prev) => [...prev, currentState]);

                isUndoRedo = true;

                canvas.loadFromJSON(updatedStack[updatedStack.length - 1]).then(() => {
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
                return updatedStack;
            }
            return prevStack;
        })
    }

    const redo = () => {
        setRedoStack((prevStack) => {
            if (prevStack.length > 0) {
                const updatedStack = [ ...prevStack ]
                const stateToRedo = updatedStack.pop();
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
                return updatedStack;
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

        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);

    }, [canvas, copiedObject]);

    return (
        <CanvasContext.Provider 
            value={{ 
                canvas, 
                canvasRef,
                canvasConfig, 
                setCanvasConfig,
                saveState,
                toolRef,
                plotterRef,
                canvasObjs, 
                setCanvasObjs
            }}
        >
            { children }
        </CanvasContext.Provider>
    );
};

