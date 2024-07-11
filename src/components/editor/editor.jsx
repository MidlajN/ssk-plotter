/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import { CloudUpload, Square, Circle, Triangle, } from "lucide-react";
import useCanvas from "../../context";
import './editor.css';


export function Default({ strokeColor, setStrokeColor, tool, element, setElement }) {
    const { canvas } = useCanvas();
    const [ renderElements, setRenderElements ] = useState(false);

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
    }, [canvas, setStrokeColor])

    useEffect(() => {
        if (tool === 'Elements') {
            setRenderElements(true);
        }
    }, [tool])

    const handleTransitionEnd = () => {
        if (tool !== 'Elements') {
            setRenderElements(false);
        }
    };
    return (
        <>
            <div className="pb-6">
                <div className="border-b-2 border-[#1c274c1c] py-1 mb-4 hidden md:block">
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

                <div 
                    className="overflow-hidden mt-4" 
                    style={{ height: `${ tool === 'Elements' ? '8rem' : '0' }`, transition: ' 0.5s ease'}} 
                    onTransitionEnd={handleTransitionEnd}
                >
                    { renderElements && <Elements element={element} setElement={setElement}/>}
                </div>

            </div>
        </>
    )
}

export function Elements({element, setElement}) {

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
            </div>
        </>
    )
}

// export function TextBox() {
//     return (
//         <div>TextBox</div>
//     )
// }

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