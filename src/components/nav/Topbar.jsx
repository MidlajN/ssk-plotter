import useCanvas from "../../context/CanvasContext";
import { useEffect, useState } from "react";
import { util } from "fabric";
import { handleFile } from "../../util/functions";
import { 
    Download, 
    // RectangleHorizontal, 
    // RectangleVertical, 
    // Shrink 
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
                height: 210,
                width: 297,
            }));
        } else if (selected === 'A3') {
            setCanvasConfig(prev => ({
                ...prev,
                height: 297,
                width: 420,
            }));
        }
        setCanvasSize(e.target.value)
    }

    useEffect(() => {
        if (canvasConfig.height === 210 && canvasConfig.width === 297) {
            setCanvasSize('A4');
        } else if (canvasConfig.height === 297 && canvasConfig.width === 420) {
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

                {/* <div className="flex gap-1">
                    <div 
                        className={
                            `w-7 h-6 flex items-center justify-center cursor-pointer
                            ${ canvasConfig.orientation === 'horizontal' ? 'bg-slate-200 border border-slate-300' : '' }`
                        }
                        onClick={() => setCanvasConfig(prev => ({...prev, orientation: 'horizontal'}))}
                        >
                        <RectangleHorizontal size={18} strokeWidth={1} color={'#000'}/>
                    </div>

                    <div 
                        className={
                            `w-7 h-6 flex items-center justify-center cursor-pointer
                            ${ canvasConfig.orientation === 'vertical' ? 'bg-slate-200 border border-slate-300' : '' }`
                        }
                        onClick={() => setCanvasConfig(prev => ({...prev, orientation: 'vertical'}))}
                        >
                        <RectangleVertical size={18} strokeWidth={1} color={'#000'}/>
                    </div>
                </div>

                <div className="pr-1">
                    <Shrink size={18} strokeWidth={1.6} color={'#000'}/>
                </div> */}
            </div>
        </>
    )
}
