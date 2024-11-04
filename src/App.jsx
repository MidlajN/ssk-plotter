/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useState } from "react";
import { Default, Import } from "./components/editor/Editor.jsx";
import { Plot } from "./components/plotter/Plot.jsx";
import useCanvas from "./context/CanvasContext.jsx";
import { BottomNav, SideNav } from "./components/nav/Sidebar.jsx";
import { TopBar } from "./components/nav/Topbar.jsx";
import { useEditorSetup } from "./components/editor/useEditorSetup.jsx";
import { NavBar } from "./components/nav/Navbar.jsx";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { handleFile } from "./util/functions.js";
import { ChevronLeft, ChevronRight } from "lucide-react";
import './App.css'

export default function Home() {
  const { canvas, saveState, toolRef, canvasRef, objectValues } = useCanvas();
  const [ tool, setTool ] = useState('Select');
  const [ expanded, setExpanded ] = useState(true);
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

        <div className="h-[91%] bg-[#ebebeb] relative"> 
          <div className={`hidden lg:block ${ hideSideBar ? 'lg:hidden' : '' } absolute left-3 top-1/2 -translate-y-1/2 z-10 h-fit w-fit`}>
            <SideNav tool={ tool } setTool={ setTool } setExpanded={ setExpanded } />
          </div>

          <div className="canvas-section flex flex-col lg:flex-row">
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
                      onDrop={ e => { e.preventDefault(); handleFile(e.dataTransfer.files[0], canvas) } } 
                      onDragOver={ e => { e.preventDefault(); } }
                    >
                      <canvas ref={ canvasRef } className="fabricCanvas"></canvas>
                    </div>
                  </TransformComponent>
              </TransformWrapper>

              <button className="toggle" onClick={() => setExpanded(!expanded)}>{ expanded ? <ChevronRight size={30} color="#1c8096" /> : <ChevronLeft size={30} color="#1c8096" /> }</button>
              <div className={`hidden lg:block ${ hideSideBar ? 'lg:hidden' : '' } absolute top-3 left-1/2 -translate-x-1/2 z-10 h-fit w-fit`}>
                <TopBar tool={ tool } setTool={ setTool } setExpanded={ setExpanded } />
              </div>
            </div>

            <div className={`${ expanded ? '  min-[1300px]:w-[20%] lg:w-[45%]' : 'lg:w-[0]' } bg-white transition-all duration-500 lg:overflow-hidden`}>
              <BottomNav tool={tool} setExpanded={setExpanded} setTool={setTool} />

              <div className={ `h-full transition-all duration-[2s] overflow-hidden ${ expanded ? 'opacity-100 ' : 'opacity-0'}`}>
                { (tool !== 'Import' && tool !== 'Plot') &&  <Default strokeColor={strokeColor} setStrokeColor={setStrokeColor} tool={tool} element={element} setElement={setElement} />}
                { tool === 'Import' && <Import /> }
                { tool === 'Plot' && <Plot /> }
              </div>
            </div>
            {/* <div className={`absolute bottom-0 ${ expanded ? 'md:w-[80%]' : 'w-full' } w-full py-2 px-4 footer transition-all duration-500 overflow-scroll no-scrollbar`}>
                <div><p>X : { objectValues.x }</p></div>
                <div><p>Y : { objectValues.y }</p></div>
                <div><p>scaleX : { objectValues.scaleX }</p></div>
                <div><p>scaleY : { objectValues.scaleY }</p></div>
                <div><p>angle : { objectValues.rotateAngle }</p></div>
            </div> */}
        </div>
        </div>
      </section>
    </>
  )
}

