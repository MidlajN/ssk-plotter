/* eslint-disable react/prop-types */
// import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { handleFile } from "./editor/functions";
import './container.css';
import  useCanvas  from "../context";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function Container({ children, expanded, setExpanded, hideSideBar }) {
    const { 
        canvas, 
        canvasRef, 
        objectValues, 
    } = useCanvas();

    return (
        <section className={`h-full ${ hideSideBar ? 'w-full' : 'w-[97%]' } flex canvas-section relative overflow-hidden max-w-[100vw] max-h-[100vh]`}>
            <div className={`canvas ${ expanded ? 'w-[80%]' : 'w-[100%]' } relative overflow-hidden transition-all duration-500`}>
                <TransformWrapper
                    initialScale={.2} 
                    maxScale={1}
                    minScale={.1} 
                    limitToBounds={ false }
                    panning={{ excluded: ['fabricCanvas'] }}
                >
                    <TransformComponent
                        contentStyle={{  margin:'auto'}} 
                        wrapperStyle={{  width: '100%', height: '100%', overflow:'visible', display:'flex', left:'15vw', top:'8rem' }}
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

                <button onClick={() => setExpanded(!expanded)}>{ expanded ? <ChevronRight size={30} color="#1c8096" /> : <ChevronLeft size={30} color="#1c8096" /> }</button>
            </div>

            <div className={`${ expanded ? 'w-[20%]' : 'w-[0]' } bg-white transition-all duration-500 overflow-hidden`}>
                { children } 
            </div>
            <div className={`absolute bottom-0 ${ expanded ? 'w-[80%]' : 'w-full' } py-2 px-4 footer transition-all duration-500`}>
                <div><p>X : { objectValues.x }</p></div>
                <div><p>Y : { objectValues.y }</p></div>
                <div><p>scaleX : { objectValues.scaleX }</p></div>
                <div><p>scaleY : { objectValues.scaleY }</p></div>
                <div><p>angle : { objectValues.rotateAngle }</p></div>
            </div>
        </section>
    )
}