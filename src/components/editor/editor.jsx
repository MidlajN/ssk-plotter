/* eslint-disable no-undef */
import { CloudUpload } from "lucide-react";
import useCanvas from "../../context";
import './editor.css';
import { useEffect } from "react";



export function Default() {
    return (
        <div>Default</div>
    )
}

export function Elements() {
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

export function Lines() {
    const { canvas } = useCanvas();

    useEffect(() => {
        let line;
        let mouseDown = false;
        if (canvas) {
            canvas.selection = false;
            canvas.hoverCursor = 'auto';
            canvas.on('mouse:down', (event) => {
                let pointer = canvas.getPointer(event.e)

                if (!mouseDown) {
                    mouseDown = true
                    line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                        id: 'added-line',
                        strokeWidth: 5,
                        stroke: 'red',
                        selectable: false
                    })
                    canvas.add(line)
                    canvas.requestRenderAll()
                }
            })
            canvas.on('mouse:move', (event) => {
                if (mouseDown) {
                    let pointer = canvas.getPointer(event.e)
                    line.set({ 
                        x2: pointer.x, 
                        y2: pointer.y 
                    })
                    canvas.requestRenderAll()
                }
            })
            canvas.on('mouse:up', (e) => {
                line.setCoords()
                mouseDown = false;
            })

            return () => {
                canvas.selection = true;
                canvas.hoverCursor = 'all-scroll';

                canvas.getObjects().forEach(obj => {
                    if (obj.id === 'added-line') {
                        obj.set({
                            selectable: true
                        })
                    }
                })

                canvas.off('mouse:down');
                canvas.off('mouse:move');
                canvas.off('mouse:up');
            }
        }
    },[])
    return (
        <div>Lines</div>
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
                const svgObj = fabric.util.groupSVGElements(objects, options);
                svgObj.set({ selectable: true, hasControls: true });
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