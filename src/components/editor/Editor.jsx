/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import useCanvas from "../../context/CanvasContext";
import useCom from "../../context/ComContext";
import './editor.css';
import { Eye, Trash2, X } from "lucide-react";
import { deleteObject } from "../../util/functions";
import { motion, AnimatePresence } from "framer-motion";
import { PenIcon } from "../Icons";
import { ChromePicker } from "react-color";
import { util } from "fabric";


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

                    console.log(activeObject[0].get('angle'))
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
                    </motion.div>

                    <motion.div
                        key={2}
                        className="h-full w-full"
                        initial={{ scale: 0.8, opacity: 0, translateY: 20 }}
                        animate={{ scale: 1, opacity: 1, translateY: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex flex-wrap gap-x-1 gap-y-1 justify-center items-center">
                            { colors.map((color, index) => (
                                <div 
                                    key={ index }
                                    className="rounded-md mx-auto cursor-pointer w-[28%] h-[6.2rem] text-ellipsis overflow-hidden p-1" 
                                    // style={{ borderColor: strokeColor === color.color ? '#1f7f9481' : 'white' }}
                                    onClick={ () => { setStrokeColor(color.color)}}
                                >
                                    <div className="p-6 border-4 border-white rounded-md" style={{ backgroundColor: color.color, boxShadow: strokeColor === color.color ? '#1f7f9481 0px 0px 1px 3px' : '' }}></div>
                                    <p className={`text-center text-sm pt-1 break-words ${ color.color === strokeColor ? 'text-black  font-medium' : 'text-gray-500'  }`}>{ color.name }</p>
                                </div>
                            ))}
                            <button className="text-sm bg-gray-100 py-0.5 px-3 rounded-full font-medium border text-[#16687a]" onClick={() => setIsOpen(true)}>Manage Colors..</button>
                        </div>
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
                            <div className="h-48 overflow-scroll scrollbar-hide">
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


const ManageColors = ({ isOpen, setIsOpen, strokeColor, setStrokeColor }) => {
    const { colors, setColors } = useCom();
    const { canvas } = useCanvas();
    const [ displayPalette, setDisplayPalettte ] = useState({ open: false, index: null });

    const updateName = (index, newName) => {
        const updatedColors = colors.map((color, i) => (
            i === index ? { ...color, name: newName } : color
        ));
        setColors(updatedColors)

    }

    const updateColor = (index, newColor, oldColor) => {
        const updatedColors = colors.map((color, i) => (
            i === index ? { ...color, color: newColor.hex } : color
        ));
        setColors(updatedColors);
        canvas.getObjects().forEach(obj => {
            if (obj.get('stroke') === oldColor) {
                obj.set({
                    stroke: newColor.hex
                });
            }
        })
        canvas.renderAll()
        if( strokeColor === oldColor) {
            setStrokeColor(newColor.hex)
        }
    }

    const togglePopup = () => {
        setIsOpen(!isOpen);
        setDisplayPalettte({ open: false, index: null })
    }

    return (
        <>
            <AnimatePresence>
                { isOpen && (
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-opacity-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={ togglePopup }
                    >
                        <motion.div
                            className="absolute right-[18%] w-fit bg-white rounded-xl shadow-lg border border-[#1c7f969c]"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing on popup click
                        >
                            <div className="flex justify-end items-center border-b "> 
                                {/* <p className="pl-6">Color Manager</p> */}
                                <button className="p-3 rounded-tr-xl hover:bg-gray-100 transition-all duration-300 active:bg-gray-300" onClick={togglePopup}> 
                                    <X size={18} strokeWidth={1.5} />
                                </button>
                            </div>
                            <div className="colorManager">
                                { colors.map((color, index) => (
                                    <div key={index} className="item" >
                                        <PenIcon stroke={ color.color } width={35} height={20} />
                                        <p className="text-sm">{ index + 1 }</p>
                                        <input 
                                            type="text" 
                                            value={ color.name } 
                                            onChange={(e) => updateName(index, e.target.value)}
                                        />
                                        <div className="w-7 h-7 rounded-lg" style={{ background: color.color }} onClick={() => setDisplayPalettte({ open: true, index: index })}></div>
                                        { displayPalette.open && index === displayPalette.index &&
                                            <>
                                                <div className="absolute z-[2]">
                                                    <div className="fixed top-0 right-0 left-0 bottom-0" onClick={() => setDisplayPalettte({ open: false, index: null })} />
                                                    <ChromePicker  color={ color.color } onChange={ (clr) => updateColor( index, clr, color.color )} />
                                                </div>
                                            </>
                                        }
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}