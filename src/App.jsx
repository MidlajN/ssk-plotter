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
import useCom from "./context/ComContext.jsx";
import { AnimatePresence, motion } from "framer-motion";

export default function Home() {
  const { 
    canvas, 
    saveState, 
    toolRef, 
    canvasRef, 
    plotterRef,
  } = useCanvas();
  const { colors, plotterCanvas, setPlotterCanvas } = useCom()
  const transformRef = useRef()
  const [ tool, setTool ] = useState('Select');
  const [ expanded, setExpanded ] = useState(true);
  const [ hideSideBar, setHideSideBar ] = useState(false);
  const [ strokeColor, setStrokeColor ] = useState(colors[0].color);
  const [ element, setElement ] = useState('rectangle');
  const [ canvasObjs, setCanvasObjs ] = useState(null)

  useEffect(() => {
    if (tool === 'Plot') {
      if (transformRef.current) transformRef.current.resetTransform();
      
      FabricObject.ownDefaults.hasControls = false;
      FabricObject.ownDefaults.borderDashArray = [15];

      const plotCanvas = new Canvas(plotterRef.current, {
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

      setPlotterCanvas(plotCanvas)
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
          plotCanvas.add(clonedObj)
        })
      })

      plotCanvas.renderAll()

      return () => {
        plotCanvas.dispose();
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

        <div className="h-[91%] bg-[#ebebeb]"> 
          <AnimatePresence>
            { !hideSideBar &&
              <motion.div
                className={`absolute left-3 top-1/2 -translate-y-1/2 z-10`}
                initial={{ opacity: 0, translateX: -20 }}
                animate={{ opacity: 1, translateX: 0 }}
                exit={{ opacity: 0, translateX: -20}}
                transition={{ duration: 0.5 }}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <SideNav tool={ tool } setTool={ setTool } setExpanded={ setExpanded } element={element} setElement={ setElement } />
                </div>
              </motion.div>
            } 
          </AnimatePresence>

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
                  }}
                >
                  <div 
                    className="machine-outer"
                    style={{ display: tool === 'Plot' ? 'block' : 'none' }}
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

              <button className="toggle lg:hidden" onClick={() => setExpanded(!expanded)}>
                { expanded ? 
                  <ChevronRight size={30} color="#1c8096" /> : 
                  <ChevronLeft size={30} color="#1c8096" /> 
                }
              </button>

              <AnimatePresence>
                { !hideSideBar &&
                  <motion.div
                    className={`absolute top-0 left-1/2 -translate-x-1/2 z-10 h-fit w-fit`}
                    initial={{ opacity: 0, translateY: -40 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    exit={{ opacity: 0, translateY: -40}}
                    transition={{ duration: 0.5 }}
                  >
                    <div className={`absolute top-3 left-1/2 -translate-x-1/2 z-10 h-fit w-fit`}>
                      <TopBar tool={ tool } setTool={ setTool } setExpanded={ setExpanded } />
                    </div>
                  </motion.div>
                }
              </AnimatePresence>
            </div>

            <div 
              className={`
                ${ expanded ? 'w-[45%] lg:w-[17%]' : 'w-[0]' } bg-white transition-all duration-500
                lg:border-l-2 ${ tool === 'Plot' ? 'border-[#9c3c6e7c]' : 'border-[#1c7f969c]' }
              `}
            >
              <div className={ `h-full transition-all duration-[2s] ${ expanded ? 'opacity-100 ' : 'opacity-0'}`}>
                { tool !== 'Plot' &&  <Editor setTool={setTool} strokeColor={strokeColor} setStrokeColor={setStrokeColor} canvasObjs={canvasObjs} setCanvasObjs={setCanvasObjs} />}
                { tool === 'Plot' && <Plot plotCanvas={plotterCanvas} /> }
              </div>
            </div>
        </div>
        </div>
      </section>
    </>
  )
}

