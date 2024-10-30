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
        <section className={`h-full w-full ${ hideSideBar ? '' : 'lg:w-[97%]' } flex flex-col lg:flex-row canvas-section overflow-hidden relative max-w-[100vw] max-h-[100vh]`}>
            <div className={`canvas ${ expanded ? 'lg:w-[80%] h-full' : 'w-[100%]' } relative overflow-hidden transition-all duration-500`}>
                <TransformWrapper
                    initialScale={0.65} 
                    maxScale={1}
                    minScale={.5} 
                    limitToBounds={ false }
                    panning={{ excluded: ['fabricCanvas'] }}
                    // onPanningStart={handlePanStart}
                >
                    <TransformComponent
                        contentStyle={{ margin: '3rem 4rem'}} 
                        wrapperStyle={{  
                            width: '96vw', 
                            height: '90vh', 
                            overflow:'visible', 
                            display:'flex', 
                            // left:'6vw', 
                            // top:'2rem' 
                        }}
                    >
                        <div 
                        // className="machine-outer"
                        >
                            <div 
                                // className="machine-inner relative"
                                onDrop={ e => { e.preventDefault(); handleFile(e.dataTransfer.files[0], canvas) } } 
                                onDragOver={ e => { e.preventDefault(); } }
                            >
                                <canvas ref={ canvasRef } className="fabricCanvas"></canvas>
                            </div>
                        </div>
                   </TransformComponent>
                </TransformWrapper>

                <button className="toggle" onClick={() => setExpanded(!expanded)}>{ expanded ? <ChevronRight size={30} color="#1c8096" /> : <ChevronLeft size={30} color="#1c8096" /> }</button>
            </div>

            <div className={`${ expanded ? '  min-[1300px]:w-[20%] lg:w-[45%] h-[100%]' : 'lg:w-[0] h-[2rem]' } lg:h-full bg-white transition-all duration-500 lg:overflow-hidden`}>
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