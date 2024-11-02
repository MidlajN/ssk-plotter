/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */

import { useState } from "react";
// import Container from "./components/Container.jsx";
import { Default, Import } from "./components/editor/Editor.jsx";
import { Plot } from "./components/plotter/Plot.jsx";
import useCanvas from "./context/CanvasContext.jsx";
import { BottomNav, SideNav } from "./components/nav/Sidebar.jsx";
import { useEditorSetup } from "./components/editor/useEditorSetup.jsx";
import { NavBar } from "./components/nav/Navbar.jsx";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { handleFile } from "./util/functions.js";
import { ChevronLeft, ChevronRight } from "lucide-react";
import './App.css'

export default function Home() {
  const { canvas, saveState, toolRef, canvasRef, objectValues } = useCanvas();
  const [ tool, setTool ] = useState('Select');
  const [ expanded, setExpanded ] = useState(false);
  const [ hideSideBar, setHideSideBar ] = useState(false);
  const [ strokeColor, setStrokeColor ] = useState('#5e5e5e');
  const [ element, setElement ] = useState('rectangle');

  // ---- For Debug Purposes ----
  // const { setResponse, response } = useCom();
  // useEffect(() => {
  //   setResponse({ ...response, pageId: 0 })
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  useEditorSetup(canvas, tool, strokeColor, element, saveState, toolRef);

  return (
    <>
      <section className="h-dvh">
        <NavBar 
          tool={ tool } 
          setTool={ setTool } 
          setExpanded={ setExpanded } 
          setHideSideBar={ setHideSideBar } 
        />

        <div className="flex h-[91%]"> 
          <div className={`hidden lg:block ${ hideSideBar ? 'lg:hidden' : '' }`}>
            <SideNav tool={ tool } setTool={ setTool } setExpanded={ setExpanded } />
          </div>

          <div className={`canvas-section flex flex-col lg:flex-row ${ hideSideBar ? '' : 'lg:w-[97%]' }`}>
            <div className={`canvas ${ expanded ? 'lg:w-[80%] h-full' : 'w-[100%]' }`}>
                <TransformWrapper
                    initialScale={0.65} 
                    maxScale={1}
                    minScale={.5} 
                    limitToBounds={ false }
                    panning={{ excluded: ['fabricCanvas'] }}
                >
                    <TransformComponent
                        contentStyle={{ margin: '3rem 4rem'}} 
                        wrapperStyle={{  
                            width: '96vw', 
                            height: '90vh', 
                            overflow:'visible', 
                            display:'flex', 
                        }}
                    >
                        <div 
                        className=""
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
              {/* { children }  */}
              <BottomNav tool={tool} setExpanded={setExpanded} setTool={setTool} />

              <div className={ `h-full transition-all duration-[2s] overflow-hidden ${ expanded ? 'opacity-100 ' : 'opacity-0'}`}>
                { (tool !== 'Import' && tool !== 'Plot') &&  <Default strokeColor={strokeColor} setStrokeColor={setStrokeColor} tool={tool} element={element} setElement={setElement} />}
                { tool === 'Import' && <Import /> }
                { tool === 'Plot' && <Plot /> }

              </div>
            </div>
            <div className={`absolute bottom-0 ${ expanded ? 'md:w-[80%]' : 'w-full' } w-full py-2 px-4 footer transition-all duration-500 overflow-scroll no-scrollbar`}>
                <div><p>X : { objectValues.x }</p></div>
                <div><p>Y : { objectValues.y }</p></div>
                <div><p>scaleX : { objectValues.scaleX }</p></div>
                <div><p>scaleY : { objectValues.scaleY }</p></div>
                <div><p>angle : { objectValues.rotateAngle }</p></div>
            </div>
        </div>
        </div>
      </section>
    </>
  )
}

