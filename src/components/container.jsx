/* eslint-disable react/prop-types */
// import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { handleFile } from "./editor/functions";
import './style.css';
import  useCanvas  from "../context";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function Container({ children, expanded, setExpanded, hideSideBar }) {
    const { 
        canvas, 
        canvasRef, 
        objectValues, 
    } = useCanvas();

    return (
        <section className={`h-full w-full ${ hideSideBar ? '' : 'md:w-[97%]' } flex flex-col md:flex-row canvas-section relative overflow-hidden max-w-[100vw] max-h-[100vh]`}>
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

                <button onClick={() => setExpanded(!expanded)}>{ expanded ? <ChevronRight size={30} color="#1c8096" /> : <ChevronLeft size={30} color="#1c8096" /> }</button>
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