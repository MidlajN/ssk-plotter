/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import useCanvas from "../../context/CanvasContext";
import useCom from "../../context/ComContext";
import { deleteObject } from "../../util/functions";
import { motion, AnimatePresence } from "framer-motion";
import { ManageColors, ObjectAlignComponent } from "./Components";
import { util } from "fabric";
import { Trash2, Eye } from "lucide-react";
import './editor.css';

export function Editor({ setTool, strokeColor, setStrokeColor,  canvasObjs, setCanvasObjs }) {
    const { canvas } = useCanvas();
    const { colors } = useCom()
    const [ dimension, setDimensions ] = useState({ width: 0, height: 0, angle: 0, active: false })
    const [ activeObjects, setActiveObjects ] = useState(null);
    const [ isOpen, setIsOpen ] = useState(false);

    useEffect(() => {
        if (canvas) {
            
            const handleObject = () => {
                const activeObject = canvas.getActiveObjects();
                if (activeObject.length === 1) {
                    console.log(activeObject)
                    const color = activeObject[0].get('stroke');
                    if (color) setStrokeColor(color);
                    const pixelWidth = activeObject[0].get('width');
                    const scaleX = activeObject[0].get('scaleX');
                    const scaledWidth = pixelWidth * scaleX;
                    const mmWidth = parseFloat(scaledWidth * 25.4 / 96).toFixed(2);

                    const pixelHeight = activeObject[0].get('height');
                    const scaleY = activeObject[0].get('scaleY');
                    const scaledHeight = pixelHeight * scaleY;
                    const mmHeight = parseFloat(scaledHeight * 25.4 / 96).toFixed(2);

                    // const angle = parseFloat((activeObject[0].get('angle') * 25.4) / 96).toFixed(2);
                    const angle = activeObject[0].get('angle');
                    setDimensions({ width: mmWidth, height: mmHeight, angle: angle, active: true });
                } else {
                    setDimensions({ ...dimension, active: false })
                }
            }

            canvas.on('mouse:down', handleObject);
            canvas.on('object:modified', handleObject);
            canvas.on('selection:created', handleObject);

            const setUpColor = (objects) => {
                console.log(objects)
                objects.forEach(obj => {
                    if (obj.type === 'group') {
                        setUpColor(obj.getObjects())
                    }
                    obj.set('stroke', strokeColor);
                });
                
            }

            let activeObject = canvas.getActiveObjects();
            if (activeObject.length > 0) {
                setUpColor(activeObject);
                canvas.fire('object:modified');
                canvas.renderAll();
            }

            return () => {
                canvas.off('mouse:down', handleObject);
                canvas.off('object:modified', handleObject);
                canvas.off('selection:created', handleObject);
            }
        }

    }, [canvas, strokeColor])

    useEffect(() => {
        if (!canvas) return;

        const handleSelection = () => {
            setActiveObjects([...canvas.getActiveObjects()]);
        };
        const handleAddedObject = () => {
            setCanvasObjs([...canvas.getObjects()])
            const object = canvas.getActiveObject()
            if (!object) {
                setDimensions({ width: 0, height: 0, angle: 0, active: false })
            }
        }

        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', () => setActiveObjects(null));
        canvas.on('object:added', handleAddedObject);
        canvas.on('object:removed', handleAddedObject);

        return () => {
            canvas.off('selection:created', handleSelection);
            canvas.off('selection:updated', handleSelection);
            canvas.off('selection:cleared');
            canvas.off('object:added', handleAddedObject);
            canvas.off('object:removed', handleAddedObject);
        }
    }, [canvas])

    const handleDimension = (name, value) => {
        setDimensions(prev => ({
            ...prev,
            [name]: value
        }));
        const object = canvas.getActiveObject();
        if (name === 'angle') {
            object.set({
                [name]: value
            })
        } else {
            object.set({
                [name]: util.parseUnit(`${value}mm`)
            })
        }
        canvas.discardActiveObject();
        canvas.setActiveObject(object);
        canvas.renderAll()
    }


    return (
        <>
            <div className="p-5 pb-10">
                <AnimatePresence>
                    <motion.div
                        key={1}
                        initial={{ scale: 0.8, opacity: 0, translateY: 20 }}
                        animate={{ scale: 1, opacity: 1, translateY: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <div className={`object ${ dimension.active ? " pointer-events-auto opacity-100" : "pointer-events-none opacity-40" }`}>
                            <div className="input">
                                <p>Width</p>
                                <input type="number" value={dimension.width} onInput={ (e) => handleDimension('width', e.target.value)}/>
                                <p className="text-sm pl-2">mm</p>
                            </div>
                            <div className="input">
                                <p>Height</p>
                                <input type="number" value={dimension.height} onInput={ (e) => handleDimension('height', e.target.value )}/>
                                <p className="text-sm pl-2">mm</p>
                            </div>
                            <div className="input">
                                <p>Angle</p>
                                <input type="number" value={dimension.angle} onInput={ (e) => handleDimension('angle', e.target.value )}/>
                                <p className="text-sm pl-2">deg</p>
                            </div> 
                        </div>
                        
                        <div className="pt-4">
                            <ObjectAlignComponent />
                        </div>

                    </motion.div>

                    <motion.div
                        key={2}
                        className="h-full w-full flex flex-col gap-4"
                        initial={{ scale: 0.8, opacity: 0, translateY: 20 }}
                        animate={{ scale: 1, opacity: 1, translateY: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 justify-center items-center">
                            { colors.map((color, index) => (
                                <div 
                                    key={ index }
                                    className="rounded-md mx-auto cursor-pointer w-full overflow-hidden p-1" 
                                    // style={{ borderColor: strokeColor === color.color ? '#1f7f9481' : 'white' }}
                                    onClick={ () => { setStrokeColor(color.color)}}
                                >
                                    <div className="p-4 border-4 border-white rounded-md" style={{ backgroundColor: color.color, boxShadow: strokeColor === color.color ? '#1f7f9481 0px 0px 1px 3px' : '' }}></div>
                                    <p className={`text-center text-sm pt-1 truncate ${ color.color === strokeColor ? 'text-black  font-medium' : 'text-gray-500'  }`}>{ color.name }</p>
                                </div>
                            ))}
                        </div>
                        <button className="text-sm mx-auto bg-gray-100 active:bg-gray-50 py-0.5 px-3 rounded-full font-medium border text-[#16687a]" onClick={() => setIsOpen(true)}>Manage Colors..</button>
                    </motion.div>
                    
                    <ManageColors isOpen={isOpen} setIsOpen={setIsOpen} strokeColor={strokeColor} setStrokeColor={setStrokeColor} />

                    <motion.div
                        key={3}
                        initial={{ opacity: 0, translateY: 20 }}
                        animate={{ opacity: 1, translateY: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <div className="p-4 mt-6 bg-gray-100 rounded-xl">
                            <h1 className="border-b border-[#1c7f969c] mb-4 pb-1 font-medium">Objects</h1>
                            <div className=" h-40 overflow-scroll scrollbar-hide">
                                { canvasObjs?.map((object, index) => (
                                    <div 
                                        key={ index } 
                                        className="flex items-center gap-4 py-2 px-2 border-b cursor-pointer"
                                        onClick={() => {
                                            canvas.setActiveObject(object);
                                            setTool('Select');
                                            canvas.renderAll();
                                        }}
                                        style={{ background: activeObjects?.includes(object) ? '#e5e7eb' : '' }}
                                    >
                                        <Eye size={18} strokeWidth={1.5} style={{ color: 'gray' }} />
                                        <p className="text-sm">{index + 1} - <span className="capitalize">{ object.get('type') }</span></p>
                                        <div className="w-4 h-4 rounded-md ml-auto" style={{ background: object.get('stroke')}} ></div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end items-center gap-4 pt-3" style={{ pointerEvents: activeObjects ? '' : 'none' }} >
                                <Trash2 
                                    size={18} 
                                    strokeWidth={1.5} 
                                    style={{ color: activeObjects ? 'black' : 'gray' }} 
                                    onClick={ () => deleteObject(canvas)} 
                                    className="cursor-pointer active:text-red-700"
                                />
                            </div>
                        </div>
                    </motion.div> 
                </AnimatePresence>
            </div>
        </>
    )
}