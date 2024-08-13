/* eslint-disable react/prop-types */
// import React from "react";
import { ChevronLeft, ChevronRight, GripHorizontal, X } from "lucide-react";
import { handleFile } from "./editor/functions";
import './style.css';
import  useCanvas, { useCom }  from "../context";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { useCallback, useRef } from "react";

export default function Container({ children, expanded, setExpanded, hideSideBar }) {
    const { 
        canvas, 
        canvasRef, 
        objectValues, 
    } = useCanvas();
    const { config } = useCom()

    return (
        <section className={`h-full w-full ${ hideSideBar ? '' : 'md:w-[97%]' } flex flex-col md:flex-row canvas-section overflow-hidden relative max-w-[100vw] max-h-[100vh]`}>
            <div className={`canvas ${ expanded ? 'md:w-[80%]' : 'w-[100%]' } relative overflow-hidden transition-all duration-500`}>
                <TransformWrapper
                    initialScale={.3} 
                    maxScale={1}
                    minScale={.25} 
                    limitToBounds={ false }
                    panning={{ excluded: ['fabricCanvas'] }}
                >
                    <TransformComponent
                        contentStyle={{  margin:'auto'}} 
                        wrapperStyle={{  width: '100%', height: '100%', overflow:'visible', display:'flex', left:'8vw', top:'2rem' }}
                    >
                        <div className="machine-outer">
                            <div className="machine-inner relative"
                                onDrop={ e => { e.preventDefault(); handleFile(e.dataTransfer.files[0], canvas) } } 
                                onDragOver={ e => { e.preventDefault(); } }
                            >
                                <canvas ref={ canvasRef } className="fabricCanvas"></canvas>
                            </div>
                        </div>
                   </TransformComponent>
                </TransformWrapper>

                <button className="toggle" onClick={() => setExpanded(!expanded)}>{ expanded ? <ChevronRight size={30} color="#1c8096" /> : <ChevronLeft size={30} color="#1c8096" /> }</button>

                <div className="absolute w-fit h-full bg-white p-5 flex flex-col transition-all duration-500" style={{ right: config.open ? 0 : '-30rem'}}>
                    <ConfigComponent />
                </div>
            </div>

            <div className={`${ expanded ? '  min-[1300px]:w-[20%] md:w-[40%] h-[82%]' : 'md:w-[0] h-[2rem]' } md:h-full bg-white transition-all duration-500 md:overflow-hidden`}>
                { children } 
            </div>
            <div className={`absolute bottom-0 ${ expanded ? 'md:w-[80%]' : 'w-full' } w-full py-2 px-4 footer transition-all duration-500 overflow-scroll no-scrollbar`}>
                <div><p>X : { objectValues.x }</p></div>
                <div><p>Y : { objectValues.y }</p></div>
                <div><p>scaleX : { objectValues.scaleX }</p></div>
                <div><p>scaleY : { objectValues.scaleY }</p></div>
                <div><p>angle : { objectValues.rotateAngle }</p></div>
            </div>
        </section>
    )
}

function ConfigComponent() {
    const { colors, setColors, config, setConfig } = useCom();
    const dragDiv = useRef(0);
    const dragOverDiv = useRef(0)

    const handleSort = () => {
        const cloneColors = [...colors];
        const temp = cloneColors[dragDiv.current]
        cloneColors[dragDiv.current] = cloneColors[dragOverDiv.current];
        cloneColors[dragOverDiv.current] = temp
        setColors(cloneColors)
    }

    const InputComponent = useCallback(({ inputKey, config, setConfig, label, limit=null }) => {
        
        const handleChange = (e) => {
            let value = e.target.value;
            if (limit) {
                value = parseInt(value < limit ? value : limit)
                value = isNaN(value) ? 0 : value
            }
            setConfig({ ...config, [inputKey]: value })
        }
        return (
            <div className="flex items-center justify-between relative py-1">
                <div className="flex gap-3 items-center justify-between rounded-[7px] p-1 bg-white z-10 w-full">
                    <p className="text-[#7a7a7a] font-medium">{label}</p>
                    <input 
                        type="text" 
                        className="text-end pr-2 transition-all duration-500 outline-none border-b focus:border-[#1c7f969c]" 
                        value={config[inputKey]} 
                        onChange={ handleChange }
                    />
                </div>
            </div>
        )
    }, [])

    return (
        <>
            <div className="flex justify-between border-b pb-2 border-[#1c8096]">
                <p className="font-medium text-[#0c4350]">Machine Configuration</p>
                <button onClick={ () => { setConfig({ ...config, open: false })}}><X size={20} strokeWidth={4} color={'red'} /></button>
            </div>
            <div className="py-5">
                <InputComponent inputKey={`url`} config={config} setConfig={setConfig} label={'Machine URL'}/>
                <InputComponent inputKey={`feedRate`} config={config} setConfig={setConfig} label={'Feed Rate'} limit={12000}/>
                <InputComponent inputKey={`jogSpeed`} config={config} setConfig={setConfig} label={'Jog Speed'} limit={15000}/>
                <InputComponent inputKey={`zOffset`} config={config} setConfig={setConfig} label={'Z - Offset'} limit={10}/>
            </div>

            <div className="flex flex-col gap-2 py-4">
                <p className="font-medium text-lg text-[#0a3f4b] mb-3">Pen Colors</p>
                { colors.map((color, index) => (
                    <div 
                        key={index} 
                        className="flex justify-between items-center py-1 border-b" 
                        draggable
                        onDragStart={ () =>  ( dragDiv.current = index )}
                        onDragEnter={ () => { dragOverDiv.current = index }}
                        onDragEnd={ handleSort }
                        onDragOver={ (e) => { e.preventDefault() }}
                    >
                        <div className="flex gap-2 items-center">
                            <GripHorizontal color="gray" />
                            <div className="border w-10 h-6 ml-2 rounded bg-slate-500" style={{ backgroundColor: `${color.color}`}}></div>
                            <p className="font-medium text-[#035264] text-md">{color.name}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#f0f0f0] py-1 px-1 rounded-md">
                            <p className="px-2 text-[#0a3f4b] text-sm">Z-Value :</p>
                            <input 
                                className="text-center text-sm  pr-1 max-w-14 rounded outline-none" 
                                type="text"
                                value={color.zValue} 
                                onChange={(e) => {
                                    let value = e.target.value
                                    setColors(prevColor => 
                                        prevColor.map((clr, idx) =>
                                            idx === index ? {...clr, zValue: value } : clr
                                        )
                                    )
                                }}
                                onBlur={() => {
                                    // Convert to float when the input loses focus
                                    let value = parseFloat(color.zValue);
                                    if (isNaN(value)) value = 0;
                                    value = value > 20 ? 20 : value;

                                    // Update the state with the parsed float value
                                    setColors(prevColors =>
                                        prevColors.map((clr, idx) =>
                                            idx === index ? { ...clr, zValue: value } : clr
                                        )
                                    );
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </>
    )
}