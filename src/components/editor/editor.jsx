/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import { CloudUpload } from "lucide-react";
import useCanvas from "../../context";
import './editor.css';



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

    useEffect(() => {
        let circle;
        let mouseDown = false;
        let initialPointer;
        if (canvas) {
            canvas.selection = false;
            canvas.hoverCursor = 'auto';
            canvas.getObjects().forEach(obj => {
                obj.set({
                    selectable: false
                })
            })

            canvas.on('mouse:down', (event) => {
                mouseDown = true;
                initialPointer = canvas.getPointer(event.e);

                circle = new fabric.Circle({
                    radius: 10,
                    stroke: 'black',
                    strokeWidth: 3,
                    fill: 'transparent',
                    left: initialPointer.x,
                    top: initialPointer.y,
                    originX: 'center',
                    originY: 'center',
                    selectable: false
                });
                canvas.add(circle);
            })

            canvas.on('mouse:move', (event) => {
                if (mouseDown) {
                    const pointer = canvas.getPointer(event.e);
                    const radius = Math.sqrt(Math.pow(pointer.x - initialPointer.x, 2) + Math.pow(pointer.y - initialPointer.y, 2));
                    circle.set({ radius: radius });
                    canvas.renderAll();
                }
            })

            canvas.on('mouse:up', (event) => {
                circle.setCoords();
                mouseDown = false;
            })

            return () => {
                canvas.selection = true;
                canvas.hoverCursor = 'all-scroll';
                canvas.getObjects().forEach(obj => {
                    obj.set({
                        selectable: true
                    })
                })

                canvas.off('mouse:down');
                canvas.off('mouse:move');
                canvas.off('mouse:up');
                canvas.renderAll();
            }
        }
    }, [canvas])
    return (
        <div>Elements</div>
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