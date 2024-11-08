/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { Editor } from "./components/editor/Editor.jsx";
import { Plot } from "./components/plotter/Plot.jsx";
import useCanvas from "./context/CanvasContext.jsx";
import { SideNav } from "./components/nav/Sidebar.jsx";
import { TopBar } from "./components/nav/Topbar.jsx";
import { useEditorSetup } from "./components/editor/useEditorSetup.jsx";
import { NavBar } from "./components/nav/Navbar.jsx";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { handleFile } from "./util/functions.js";
import { ChevronLeft, ChevronRight } from "lucide-react";
import './App.css'
import { Canvas, FabricObject, util } from "fabric";

export default function Home() {
  const { 
    canvas, 
    saveState, 
    toolRef, 
    canvasRef, 
    // objectValues, 
    plotterRef 
  } = useCanvas();
  const transformRef = useRef()
  const [ tool, setTool ] = useState('Select');
  const [ expanded, setExpanded ] = useState(true);
  const [ hideSideBar, setHideSideBar ] = useState(false);
  const [ strokeColor, setStrokeColor ] = useState('#5e5e5e');
  const [ element, setElement ] = useState('rectangle');
  const [ canvasObjs, setCanvasObjs ] = useState(null)

  // ---- For Debug Purposes ----
  // const { setResponse, response } = useCom();
  // useEffect(() => {
  //   setResponse({ ...response, pageId: 0 })
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [])

  useEffect(() => {
    if (tool === 'Plot') {
      if (transformRef.current) transformRef.current.resetTransform();
      
      FabricObject.ownDefaults.hasControls = false;
      FabricObject.ownDefaults.borderDashArray = [15];

      const plotterCanvas = new Canvas(plotterRef.current, {
        width: util.parseUnit(`430mm`),
        height: util.parseUnit(`310mm`),
        backgroundColor: "white",
        fireRightClick: true,
        stopContextMenu: true,
        centeredRotation: true,
        selectionDashArray: [10],
        selectionBorderColor: '#095262',
        selectionColor: '',
        controlsAboveOverlay: false
      });

      const objects = canvas.getObjects();
      objects.forEach((obj) => {
        obj.clone().then(clonedObj => {
          clonedObj.set({
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true,
            borderDashArray: [13],
            cornerSize: 0,
            hasControls: false
          })
          plotterCanvas.add(clonedObj)
        })
      })

      plotterCanvas.renderAll()

      return () => {
        plotterCanvas.dispose();
        FabricObject.ownDefaults.hasControls = true;
        FabricObject.ownDefaults.borderDashArray = [0]
      }
    } else if (canvas){
      canvas.renderAll()
    }

  }, [tool])

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
          <div 
            className={` ${ hideSideBar ? 'hidden' : '' } absolute left-3 top-1/2 -translate-y-1/2 z-10 h-fit w-fit`}
          >
            <SideNav tool={ tool } setTool={ setTool } setExpanded={ setExpanded } element={element} setElement={ setElement } />
          </div>

          <div 
            className="canvas-section flex flex-row"
          >
            <div className={`canvas ${ expanded ? 'lg:w-[83%]' : 'w-[100%]' }`}>
              <TransformWrapper
                initialScale={ tool === 'Plot' ? 0.5 : 0.6 } 
                initialPositionX={ tool === 'Plot' ? 200 : null }
                initialPositionY={ tool === 'Plot' ? 100 : null }
                maxScale={3}
                minScale={.5} 
                limitToBounds={ false }
                panning={{ excluded: ['fabricCanvas'] }}
                // centerZoomedOut
                centerOnInit
                ref={transformRef}
              >
                <TransformComponent
                  wrapperStyle={{  
                    width: '100%', 
                    height: '100%', 
                    overflow:'visible', 
                    // display:'flex', 
                  }}
                  contentStyle={{ 
                    margin: '',
                  }}  
                >
                  <div 
                    className="machine-outer"
                    style={{ display: tool === 'Plot' ? 'block' : 'none'}}
                  >
                    <div className="machine-inner">
                      <div className="machine-bed">
                        <canvas ref={ plotterRef } className="fabricCanvas"></canvas>
                      </div>
                    </div>
                  </div>
                  <div 
                    onDrop={ e => { e.preventDefault(); handleFile(e.dataTransfer.files[0], canvas) } } 
                    onDragOver={ e => { e.preventDefault(); } }
                    style={{ display: tool !== 'Plot' ? 'block' : 'none'}}
                  >
                    <canvas ref={ canvasRef } className="fabricCanvas"></canvas>
                  </div>
                </TransformComponent>
              </TransformWrapper>

              <button className="toggle lg:hidden" onClick={() => setExpanded(!expanded)}>{ expanded ? <ChevronRight size={30} color="#1c8096" /> : <ChevronLeft size={30} color="#1c8096" /> }</button>
              <div className={`hidden lg:block ${ hideSideBar ? 'lg:hidden' : '' } absolute top-3 left-1/2 -translate-x-1/2 z-10 h-fit w-fit`}>
                <TopBar tool={ tool } setTool={ setTool } setExpanded={ setExpanded } />
              </div>
              {/* <button className=" absolute bottom-3 left-1/2 -translate-x-1/2 z-10 h-fit w-fit border-2">Reset</button> */}
            </div>

            <div 
              className={`
                ${ expanded ? 'w-[45%] lg:w-[17%]' : 'w-[0]' } bg-white transition-all duration-500 
                lg:overflow-hidden lg:border-l-2 ${ tool === 'Plot' ? 'border-[#9c3c6e7c]' : 'border-[#1c7f969c]' }
              `}
            >
              <div className={ `h-full transition-all duration-[2s] ${ expanded ? 'opacity-100 ' : 'opacity-0'}`}>
                { tool !== 'Plot' &&  <Editor strokeColor={strokeColor} setStrokeColor={setStrokeColor} canvasObjs={canvasObjs} setCanvasObjs={setCanvasObjs} />}
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

