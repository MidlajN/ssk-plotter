import useCanvas from "../../context/CanvasContext";
import { useEffect, useState } from "react";
import { ActiveSelection, util } from "fabric";
import { handleFile } from "../../util/functions";
import { 
    Download,
    RectangleHorizontal,
    RectangleVertical,
    Shrink, 
} from "lucide-react";

export const TopBar = () => {
    const { canvas, canvasConfig, setCanvasConfig } = useCanvas();
    const [ canvasSize, setCanvasSize ] = useState('Custom');

    const setDimension = (width, height) => {
        if (!canvas) return;
        canvas.setWidth(util.parseUnit(`${width}mm`));
        canvas.setHeight(util.parseUnit(`${height}mm`));
    }

    const handleSelect = (e) => {
        const selected = e.target.value;
        if (selected === 'A4') {
            setCanvasConfig(prev => ({
                ...prev,
                height: canvasConfig.orientation === 'vertical' ? 297 : 210,
                width: canvasConfig.orientation === 'vertical' ? 210 : 297,
            }));
        } else if (selected === 'A3') {
            setCanvasConfig(prev => ({
                ...prev,
                height: canvasConfig.orientation === 'vertical' ? 420 : 297,
                width: canvasConfig.orientation === 'vertical' ? 297 : 420,
            }));
        }
        setCanvasSize(e.target.value)
    }

    const shrinkCanvasToSelection = (canvas) => {
        let objects = canvas.getObjects();
        objects.forEach(obj => {
            if (obj.left >= canvas.width || obj.top >= canvas.height) {
                canvas.remove(obj)
            }
        })

        objects = objects.filter(obj => (
            obj.left * 25 / 96 < canvasConfig.width && obj.top * 25 / 96 < canvasConfig.height
        ))
        if (objects.length === 0) return;

        // Create an active selection
        const selection = new ActiveSelection(objects, { canvas });
        canvas.setActiveObject(selection);
        canvas.renderAll(); // Ensure the selection is visible on the canvas
      
        // Get the bounding box of the selection
        const boundingRect = selection.getBoundingRect(true); // Use true for absolute coordinates
        const newWidth = boundingRect.width + 2;
        const newHeight = boundingRect.height + 2;
      
        // Adjust all objects' positions relative to the new canvas size
        objects.forEach((obj) => {
          obj.left -= boundingRect.left - 1;
          obj.top -= boundingRect.top - 1;
          obj.setCoords(); // Update the object's coordinates
        });

        // Resize the canvas to fit the bounding box
        canvas.setWidth(newWidth);
        canvas.setHeight(newHeight);
        setCanvasConfig(prev => ({
            ...prev,
            width: parseFloat(newWidth * 25.5 / 96).toFixed(2),
            height: parseFloat(newHeight * 25.5 / 96).toFixed(2)
        }));
      
        // Clear the selection
        canvas.discardActiveObject();
        canvas.renderAll();
    };      

    useEffect(() => {
        if (canvasConfig.height === 210 && canvasConfig.width === 297) {
            setCanvasSize('A4');
        } else if (canvasConfig.height === 297 && canvasConfig.width === 210) {
            setCanvasSize('A4');
        }else if (canvasConfig.height === 297 && canvasConfig.width === 420) {
            setCanvasSize('A3');
        }else if (canvasConfig.height === 420 && canvasConfig.width === 297) {
            setCanvasSize('A3');
        } else {
            setCanvasSize('Custom')
        }
        
        setDimension(canvasConfig.width, canvasConfig.height);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [canvasConfig])

    return (
        <>
            <div className="topBar">
                <div className="svgImport">
                    <Download size={18} strokeWidth={2} color={'#000'}/>
                    <p>Import</p>
                    <input type="file" onInput={ e => handleFile(e.target.files[0], canvas) } />
                </div>

                <select value={canvasSize} onChange={handleSelect}>
                    <option value="A3">A3</option>
                    <option value="A4">A4</option>
                    <option value="Custom">Custom</option>
                </select>

                <div className="input">
                    <p>W</p>
                    <input 
                        type="number" 
                        value={canvasConfig.width} 
                        onInput={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value > 0 && value <= canvasConfig.maxWidth) {
                                setCanvasConfig(prev => ({ 
                                    ...prev, 
                                    width: value,
                                }));
                            }
                        }}
                    />
                    <p className="text-sm">mm</p>
                </div>

                <div className="input">
                    <p>H</p>
                    <input 
                        type="number" 
                        value={canvasConfig.height} 
                        onInput={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value) && value > 0 && value <= canvasConfig.maxHeight) {
                                setCanvasConfig(prev => ({ 
                                    ...prev, 
                                    height: value,
                                }));
                            }
                        }}
                    />
                    <p className="text-sm">mm</p>
                </div>

                <div className="flex gap-1 items-center">
                    <div 
                        className={
                            `w-8 h-7 flex items-center justify-center cursor-pointer rounded-md
                            ${ canvasConfig.orientation === 'horizontal' ? 'bg-gray-200 border border-slate-200' : '' }`
                        }
                        onClick={() => {
                            if ( canvasConfig.orientation !== 'horizontal') {
                                setCanvasConfig({
                                    width: canvasConfig.height,
                                    height: canvasConfig.width,
                                    orientation: 'horizontal',
                                    maxWidth: canvasConfig.maxHeight,
                                    maxHeight: canvasConfig.maxWidth
                                })
                            }
                        }}
                        >
                        <RectangleHorizontal size={18} strokeWidth={1} color={'#000'}/>
                    </div>

                    <div 
                        className={
                            `w-8 h-7 flex items-center justify-center cursor-pointer rounded
                            ${ canvasConfig.orientation === 'vertical' ? 'bg-gray-200 border border-slate-200' : '' }`
                        }
                        onClick={() => {
                            if ( canvasConfig.orientation !== 'vertical') {
                                setCanvasConfig({
                                    width: canvasConfig.height,
                                    height: canvasConfig.width,
                                    orientation: 'vertical',
                                    maxWidth: canvasConfig.maxHeight,
                                    maxHeight: canvasConfig.maxWidth
                                })
                            }
                        }}
                        >
                        <RectangleVertical size={18} strokeWidth={1} color={'#000'}/>
                    </div>
                </div>

                <div className="pr-1 cursor-pointer" onClick={() => shrinkCanvasToSelection(canvas)}>
                    <Shrink size={18} strokeWidth={1.6} color={'#000'}/>
                </div>
            </div>
        </>
    )
}
