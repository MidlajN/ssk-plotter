/* eslint-disable react/prop-types */
import useCanvas from "../../context/CanvasContext";
import useCom from "../../context/ComContext";
import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PenIcon } from "../Icons";
import { ChromePicker } from "react-color";
import { X } from "lucide-react";
import { AlignCenterHorizontal, AlignCenterVertical, AlignEndHorizontal, AlignEndVertical, AlignHorizontalJustifyStart, AlignStartHorizontal, Eye, FlipHorizontal, FlipVertical } from "lucide-react";


export const ManageColors = ({ isOpen, setIsOpen, strokeColor, setStrokeColor }) => {
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

export const ObjectAlignComponent = () => {
    const { canvas, canvasConfig } = useCanvas()
    const [ flip, setFlip ] = useState({ x: false, y: false })

    useEffect(() => {
        if (!canvas) return
        const object = canvas.getActiveObject();
        if (object) {
            object.set({
                flipX: flip.x,
                flipY: flip.y
            })
            canvas.renderAll()
        }
    }, [canvas, flip])

    const alignObjectToCanvas = (alignment) => {
        const activeObjects = canvas.getActiveObject();
        if (!activeObjects) return;

        console.log(activeObjects)
        // let objects = []
        // if (activeObjects.type === 'activeselection') {
        //     objects = activeObjects.getObjects();
        // } else {
        //     objects = [activeObjects]
        // }

        const canvasWidth = canvas.getWidth();
        const canvasHeight = canvas.getHeight();

        // objects.forEach(obj => {
        //     obj.setCoords();

            switch (alignment) {
                case 'left':
                    activeObjects.left = 0;
                    break;
                case 'right':
                    activeObjects.left = canvasWidth - activeObjects.width * activeObjects.scaleX;
                    break;
                case 'top':
                    activeObjects.left = 0;
                    break;
                case 'centerH':
                    activeObjects.left = 0;
                    break;
                case 'centerV':
                    activeObjects.left = 0;
                    break;
                case 'bottom':
                    activeObjects.left = 0;
                    break;
            
                default:
                    break;
            }
            activeObjects.setCoords()
        // });
        canvas.renderAll();
    }

    const AlignButton = ({ Icon, handleClick}) => {
        return (
            <>
                <div 
                    className="hover:bg-gray-200 active:bg-gray-300 p-2 rounded-xl cursor-pointer transition-all duration-300"
                    onClick={handleClick}
                >
                    <Icon size={18} strokeWidth={1.5} />
                </div>
            </>
        )
    }

    return (
        <>
            <div className="px-1 py-1 flex bg-gray-100 rounded-xl items-center justify-around mb-3">
                <AlignButton Icon={ AlignHorizontalJustifyStart } handleClick={() => alignObjectToCanvas('left')} />
                <AlignButton Icon={ AlignCenterVertical } handleClick={() => alignObjectToCanvas('centerV')} />
                <AlignButton Icon={ AlignEndVertical } handleClick={() => alignObjectToCanvas('right')} />
                <AlignButton Icon={ AlignEndHorizontal } handleClick={() => alignObjectToCanvas('bottom')} />
                <AlignButton Icon={ AlignCenterHorizontal } handleClick={() => alignObjectToCanvas('centerH')} />
                <AlignButton Icon={ AlignStartHorizontal } handleClick={() => alignObjectToCanvas('top')} />
                {/* <AlignButton Icon={ AlignEndVertical } handleClick={() => alignObjectToCanvas('true')} /> */}
            </div>

            <div className="flex">
                <AlignButton Icon={ FlipHorizontal } handleClick={() => { setFlip(prev=> ({ ...prev, x: !flip.x }))}} />
                <AlignButton Icon={ FlipVertical } handleClick={() => { setFlip(prev=> ({ ...prev, y: !flip.y }))}} />
            </div>
        </>
    )
}