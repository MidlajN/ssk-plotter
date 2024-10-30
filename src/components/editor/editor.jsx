/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
/* eslint-disable no-undef */
import { useEffect, useState } from "react";
import { CloudUpload, Square, Circle, Triangle, } from "lucide-react";
import useCanvas, { useCom } from "../../context";
import { loadSVGFromString, util } from "fabric";
import './editor.css';



export function Default({ strokeColor, setStrokeColor, tool, element, setElement }) {
    const { canvas } = useCanvas();
    const { colors } = useCom()
    const [ renderElements, setRenderElements ] = useState(false);

    useEffect(() => {
        if (canvas) {

            canvas.on('mouse:down', () => {
                const activeObject = canvas.getActiveObjects();
                if (activeObject.length === 1) {
                    const color = activeObject[0].get('stroke');
                    if (color) setStrokeColor(color);
                }
            })

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

            return () => canvas.off('mouse:down');
        }

    }, [canvas, strokeColor])

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
            <div className="p-5 pb-10">
                <div className="border-b-2 border-[#1c274c1c] py-1 mb-4 hidden md:block">
                    <h1>Settings</h1>
                </div>

                <div className="py-4 flex gap-4 items-center justify-between">
                    <p className="text-lg font-medium text-gray-600">Pen Color</p>
                    <div 
                        className="flex gap-3 items-center justify-center border pr-3 rounded-full shadow-[inset_0px_1px_2px_1px_#00000025] overflow-hidden bg-[#f0f0f0]" 
                        // style={{ borderColor: strokeColor }}
                    >
                        <div className="px-6 py-3 rounded-full shadow-md" style={{ backgroundColor: strokeColor }}></div>
                        <p 
                            className="h-fit capitalize text-sm font-medium w-14 text-center drop-shadow" 
                            style={{ color: strokeColor }}
                        >
                            { colors.filter(color => color.color === strokeColor).map(color => color.name)[0] }
                        </p>
                    </div>
                </div>

                <div className="grid lg:grid-cols-5 grid-cols-8 max-[500px]:grid-cols-4 mt-8">
                    { colors.map((color, index) => (
                        <div 
                            key={ index }
                            className="rounded-md border-4 cursor-pointer" 
                            style={{ borderColor: strokeColor === color.color ? '#1f7f9481' : 'white' }}
                            onClick={ () => { setStrokeColor(color.color)}}
                        >
                            <div className="p-5 border-2 border-white rounded-md" style={{ backgroundColor: color.color }}></div>
                        </div>
                    ))}
                </div>

                <div 
                    className="overflow-hidden mt-6" 
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

export function Import() {
    const { canvas } = useCanvas();
    const handleFile = async (file) => {
        if (file.type !== 'image/svg+xml') return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            const svg = e.target.result;
            const loadedSvg = await loadSVGFromString(svg)
            console.log(loadedSvg)
            loadedSvg.objects.forEach(obj => {
                obj.set({
                    stroke: 'black',
                    strokeWidth: 2,
                    fill: 'transparent'
                })
            })
            const svgObj = util.groupSVGElements(loadedSvg.objects, loadedSvg.options);
            canvas.add(svgObj);
            canvas.renderAll();
            // loadSVGFromString(svg, (objects, options) => {
            //     console.log(objects)
            //     objects.forEach(object => {
            //         object.set({
            //             stroke: 'black',
            //             strokeWidth: 1,
            //             fill: 'transparent'
            //         })
            //     })
            //     const svgObj = util.groupSVGElements(objects, options);
            //     svgObj.set({ selectable: true, hasControls: true, });
            //     console.log("Svg objects from import -->>",objects, options, svgObj)
            //     canvas.add(svgObj);
            //     canvas.renderAll();
            // })
        }
        reader.readAsText(file);
    }

    return (
        <div className="p-5" onDragOver={ e => { e.preventDefault(); }} onDrop={ e => { e.preventDefault(); handleFile(e.dataTransfer.files[0]) } }>
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