/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import useCanvas from "../../context/CanvasContext";
import useCom from "../../context/ComContext";
import './editor.css';
import { Eye, Trash2 } from "lucide-react";
import { deleteObject } from "../../util/functions";



export function Editor({ strokeColor, setStrokeColor,  canvasObjs, setCanvasObjs }) {
    const { canvas } = useCanvas();
    const { colors } = useCom()
    const [ dimension, setDimensions ] = useState({ width: 0, height: 0, angle: 0, active: false })
    const [ activeObjects, setActiveObjects ] = useState(null);

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

                    const angle = parseFloat((activeObject[0].get('angle') * 25.4) / 96).toFixed(2);
                    setDimensions({ width: mmWidth, height: mmHeight, angle: angle, active: true });
                } else {
                    setDimensions({ ...dimension, active: false })
                }
            }

            canvas.on('mouse:down', handleObject);

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

            return () => canvas.off('mouse:down', handleObject);
        }

    }, [canvas, strokeColor])

    useEffect(() => {
        if (!canvas) return;

        const handleSelection = () => {
            setActiveObjects([...canvas.getActiveObjects()]);
        };
        const handleAddedObject = () => {
            setCanvasObjs([...canvas.getObjects()])
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


    return (
        <>
            <div className="p-5 pb-10">

                <div className={`object ${ dimension.active ? " pointer-events-auto opacity-100" : "pointer-events-none opacity-40" }`}>
                    <div className="input">
                        <p>Width</p>
                        <input type="number" value={dimension.width}/>
                        <p className="text-sm pl-2">mm</p>
                    </div>
                    <div className="input">
                        <p>Height</p>
                        <input type="number" value={dimension.height}/>
                        <p className="text-sm pl-2">mm</p>
                    </div>
                    <div className="input">
                        <p>Angle</p>
                        <input type="number" value={dimension.angle}/>
                        <p className="text-sm pl-2">deg</p>
                    </div>
                </div>


                <div className="flex flex-wrap gap-4 justify-center items-center">
                    { colors.map((color, index) => (
                        <div 
                            key={ index }
                            className="rounded-md mx-auto w-fit border-4 cursor-pointer" 
                            style={{ borderColor: strokeColor === color.color ? '#1f7f9481' : 'white' }}
                            onClick={ () => { setStrokeColor(color.color)}}
                        >
                            <div className="p-6 border-2 border-white rounded-md" style={{ backgroundColor: color.color }}></div>
                            <p className={`text-center text-sm  ${ color.color === strokeColor ? 'text-black bg-[#dbdbdb87] font-medium' : 'text-gray-500'  }`}>{ color.name }</p>
                        </div>
                    ))}
                    <button className="text-sm bg-gray-100 py-0.5 px-3 rounded-full font-medium border text-[#16687a]">Manage Colors..</button>
                </div>

                <div className="p-4 mt-6 bg-gray-100 rounded-xl">
                    <h1 className="border-b border-[#1c7f969c] mb-4 pb-1 font-medium">Objects</h1>
                    <div className="h-48 overflow-scroll scrollbar-hide">
                        { canvasObjs?.map((object, index) => (
                            <div 
                                key={ index } 
                                className="flex items-center gap-4 py-2 px-2 border-b cursor-pointer"
                                onClick={() => {
                                    canvas.setActiveObject(object);
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

                    <div className="flex justify-end items-center gap-4 pt-3" >
                        <Trash2 size={18} strokeWidth={1.5} style={{ color: 'gray' }} onClick={ () => deleteObject(canvas)} />
                    </div>
                </div>

            </div>
        </>
    )
}