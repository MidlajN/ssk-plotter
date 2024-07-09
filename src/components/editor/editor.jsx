/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import { CloudUpload, Square, Circle, Triangle, Hexagon, Bolt, ArrowBigRight, Star, Octagon, Shell, Cross, Smile, Flame } from "lucide-react";
import useCanvas from "../../context";
import './editor.css';
import { prebuiltComponents } from "./components";


export function Default({ strokeColor, setStrokeColor }) {
    const { canvas } = useCanvas();

    const handleColor = (e) => {
        const activeObject = canvas.getActiveObjects();
        if (activeObject) {
            activeObject.forEach(obj => {
                obj.set('stroke', e.target.value);
            })
            canvas.renderAll();
        }
        setStrokeColor(e.target.value);
    }

    useEffect(() => {
        if (canvas) {
            canvas.on('mouse:down', () => {
                const activeObject = canvas.getActiveObjects();
                if (activeObject.length > 0) {
                    const color = activeObject[0].get('stroke');
                    setStrokeColor(color);
                } else {
                    if (canvas.isDrawingMode === true) return;
                    setStrokeColor('black');
                }
            })
        }
    }, [canvas])
    return (
        <>
            <div>
                <div className="border-b-2 border-[#1c274c1c] py-1 mb-4">
                    <h1>Settings</h1>
                </div>

                <div className="py-4 flex justify-between">
                    <p>Pen</p>
                    <div className="flex ">
                        <div className="w-7 h-full rounded-s-md" style={{ backgroundColor: strokeColor }}></div>
                        <select name="color" id="color" className="h-full px-2 rounded-e-md" onChange={handleColor} value={strokeColor}>
                            <option value="black">Black</option>
                            <option value="red">Red</option>
                            <option value="blue">Blue</option>
                            <option value="green">Green</option>
                            <option value="yellow">Yellow</option>
                            <option value="orange">Orange</option>
                            <option value="purple">Purple</option>
                            <option value="pink">Pink</option>
                        </select>
                    </div>
                </div>

            </div>
        </>
    )
}

export function Elements() {
    const { canvas } = useCanvas();
    const [element, setElement] = useState(null)

    // useEffect(() => {
    //     let circle;
    //     let mouseDown = false;
    //     let initialPointer;
    //     if (canvas) {
    //         canvas.selection = false;
    //         canvas.hoverCursor = 'auto';
    //         canvas.getObjects().forEach(obj => {
    //             obj.set({
    //                 selectable: false
    //             })
    //         })

    //         canvas.on('mouse:down', (event) => {
    //             mouseDown = true;
    //             initialPointer = canvas.getPointer(event.e);

    //             circle = new fabric.Circle({
    //                 radius: 10,
    //                 stroke: 'black',
    //                 strokeWidth: 3,
    //                 fill: 'transparent',
    //                 left: initialPointer.x,
    //                 top: initialPointer.y,
    //                 originX: 'center',
    //                 originY: 'center',
    //                 selectable: false
    //             });
    //             canvas.add(circle);
    //         })

    //         canvas.on('mouse:move', (event) => {
    //             if (mouseDown) {
    //                 const pointer = canvas.getPointer(event.e);
    //                 const radius = Math.sqrt(Math.pow(pointer.x - initialPointer.x, 2) + Math.pow(pointer.y - initialPointer.y, 2));
    //                 circle.set({ radius: radius });
    //                 canvas.renderAll();
    //             }
    //         })

    //         canvas.on('mouse:up', (event) => {
    //             circle.setCoords();
    //             mouseDown = false;
    //         })

    //         return () => {
    //             canvas.selection = true;
    //             canvas.hoverCursor = 'all-scroll';
    //             canvas.getObjects().forEach(obj => {
    //                 obj.set({
    //                     selectable: true
    //                 })
    //             })

    //             canvas.off('mouse:down');
    //             canvas.off('mouse:move');
    //             canvas.off('mouse:up');
    //             canvas.renderAll();
    //         }
    //     }
    // }, [canvas])

    useEffect(() => {
        let object;
        let mouseDown = false;
        let startPointer;

        canvas.selection = false;
        canvas.hoverCursor = 'auto';
        canvas.getObjects().forEach(obj => {
            obj.set({
                selectable: false
            })
        })

        canvas.on('mouse:down', (event) => {
            mouseDown = true;
            startPointer = canvas.getPointer(event.e)

            object = new prebuiltComponents[element].constructor({
                ...prebuiltComponents[element].toObject(),
                left: startPointer.x,
                top: startPointer.y,
                selectable: false
            });

            canvas.add(object);
        })

        canvas.on('mouse:move', (event) => {
            if (mouseDown && object) {
                const pointer = canvas.getPointer(event.e);
                const width = Math.abs(pointer.x - startPointer.x);
                const height = Math.abs(pointer.y - startPointer.y);
                
                if (object.type === 'rect' || object.type === 'triangle') {
                    object.set({ width: width, height: height });
                    if (pointer.x < startPointer.x) object.set({ left: pointer.x });
                    if (pointer.y < startPointer.y) object.set({ top: pointer.y });
                } else if (object.type === 'circle') {
                    let radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)) / 2;
                    object.set({ radius: radius });
                    if (pointer.x < startPointer.x) object.set({ left: pointer.x });
                    if (pointer.y < startPointer.y) object.set({ top: pointer.y });
                }
                canvas.renderAll();
            }
        })

        canvas.on('mouse:up', (event) => {
            object.setCoords();
            mouseDown = false;
        })

        return () => {
            canvas.selection = true,
            canvas.hoverCursor = 'all-scroll';
            canvas.getObjects().forEach(obj => {
                obj.set({
                    selectable: true
                })
            })

            canvas.off('mouse:down');
            canvas.off('mouse:move');
            canvas.off('mouse:up');
        };
    }, [element, canvas])


    const Component = ({Icon, object}) => {
        return (
            <>
                <div    
                    className={`${ element === object ? 'bg-gray-200' : 'bg-gray-100' } hover:bg-gray-200 cursor-pointer py-6 px-6 flex justify-center items-center`} 
                    onClick={() => {
                        setElement(object)
                    }}
                >
                    <Icon width={20} height={20} />
                </div> 
            </>
        )
    }
    return (
        <>
            <div className="py-1 mb-4">
                <h1>Shapes</h1>
            </div>

            <div className="grid grid-cols-3 gap-[1px] w-full overflow-hidden rounded-md">
                <Component Icon={Square} object={'rectangle'} />
                <Component Icon={Circle} object={'circle'} />
                <Component Icon={Triangle} object={'triangle'} />
                <Component Icon={Hexagon} object={'hexagon'} />
                <Component Icon={Bolt} object={'bolt'} />
                <Component Icon={ArrowBigRight} object={'arrow'} />
                <Component Icon={Star} object={'star'} />
                <Component Icon={Octagon} object={'octagon'} />
                <Component Icon={Shell} object={'shell'} />
                <Component Icon={Cross} object={'cross'} />
                <Component Icon={Smile} object={'smile'} />
                <Component Icon={Flame} object={'flame'} />
            </div>
        </>
    )
}

export function FreeDraw({ tool }) {
    const { canvas } = useCanvas();
    

    return (
        <div>CurvedLines</div>
    )
}

export function TextBox() {
    return (
        <div>TextBox</div>
    )
}

export function Import() {
    const { canvas } = useCanvas();
    const handleFile = (file) => {
        if (file.type !== 'image/svg+xml') return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const svg = e.target.result;
            fabric.loadSVGFromString(svg, (objects, options) => {
                objects.forEach(object => {
                    object.set({
                        stroke: 'black',
                        strokeWidth: 1,
                        fill: 'transparent'
                    })
                })
                const svgObj = fabric.util.groupSVGElements(objects, options);
                svgObj.set({ selectable: true, hasControls: true, });
                console.log("RUN RUN RUN",objects, options, svgObj)
                canvas.add(svgObj);
                canvas.renderAll();
            })
        }
        reader.readAsText(file);
    }

    return (
        <div onDragOver={ e => { e.preventDefault(); }} onDrop={ e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) } }>
            <div className="border-b-2 border-[#1c274c1c] py-1">
                <h3>Upload SVG</h3>
            </div>
            <div className="py-4">
                <p className="text-[13px] text-slate-600">Upload an SVG file by clicking below. Make sure the SVG file contains valid vector graphics that you want to work with.</p>
                <div className="svgImport">
                    <CloudUpload size={70} strokeWidth={1} color={'#a7a7a7'}/>
                    <p>Drag & Drop Files <br /> or Click to Browse</p>
                    <input type="file" onChange={ e => handleFile(e.target.files[0]) } />
                    <span>.svg files only</span>
                </div>
            </div>
        </div>
    )
}