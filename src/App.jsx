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
import { Canvas, FabricImage, FabricObject, Group, Path, Pattern, Rect, util } from "fabric";
import useCom from "./context/ComContext.jsx";
import { AnimatePresence, motion } from "framer-motion";
import { parse } from "opentype.js";
import fontTTF from './ui/assets/OpenSans-Regular.ttf';
import { pattern } from "framer-motion/client";

export default function Home() {
  const { canvas, canvasRef, plotterRef, canvasObjs, setCanvasObjs } = useCanvas();
  const { colors, plotterCanvas, setPlotterCanvas, config } = useCom()
  const transformRef = useRef()
  const [ tool, setTool ] = useState('Select');
  const [ expanded, setExpanded ] = useState(true);
  const [ hideSideBar, setHideSideBar ] = useState(false);
  const [ strokeColor, setStrokeColor ] = useState(colors[0].color);
  const [ element, setElement ] = useState('rectangle');

  const fetchFont = async (fontUrl) => {
    const response = await fetch(fontUrl)
    if (!response.ok) throw new Error(`Failed Fetch Font: ${ response.statusText }`);
    return response.arrayBuffer();
  }

  const processTextObject = async (obj, fontUrl, group) => {
    const text = obj.text;
    const fontSize = obj.fontSize;
    const textBoundingRect = obj.getBoundingRect();
    const lines = text.split('\n');

    const fontBuffer = await fetchFont(fontUrl);
    const font = parse(fontBuffer);

    const tolerance = 3.3;
    let lineOffset = 0 + tolerance;
    const lineHeight = obj.lineHeight * fontSize;

    for (const line of lines) {
      const path = font.getPath(line, 0, 0, fontSize);
      const linePath = new Path(path.toPathData(), {
        left: textBoundingRect.left, 
        top: textBoundingRect.top + lineOffset * obj.scaleY,
        scaleX: obj.scaleX,
        scaleY: obj.scaleY,
        stroke: obj.stroke,
        fill: 'transparent',
        lockRotation: true,
        lockScalingX: true,
        lockScalingY: true,
        borderDashArray: [13],
        cornerSize: 0,
        hasControls: false
      });

      lineOffset += lineHeight + tolerance;
      group.add(linePath);
    }
  }

  useEffect(() => {
    if (tool === 'Plot') {
      if (transformRef.current) transformRef.current.resetTransform();
      
      FabricObject.ownDefaults.hasControls = false;
      FabricObject.ownDefaults.borderDashArray = [15];

      const setCanvasBackground = (canvas) => {
        const color =  ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 1)']
        const gridSize = 37.8;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;

        const patternCanvas = document.createElement('canvas');
        patternCanvas.width = canvasWidth;
        patternCanvas.height = canvasHeight;
        const patternCtx = patternCanvas.getContext('2d');

        patternCtx.fillStyle = '#3565ff85';
        patternCtx.fillRect(0,0, canvasWidth, canvasHeight);

        patternCtx.strokeStyle = '#FFFFFF';
        patternCtx.lineWidth = 1;

        for (let x = 0; x < canvasWidth; x += gridSize) {
          patternCtx.beginPath();
          patternCtx.moveTo(x, 0);
          patternCtx.lineTo(x, canvasHeight);
          const colorIndex = Math.floor(Math.round((x / gridSize)) % 2);
          patternCtx.strokeStyle = color[colorIndex];
          patternCtx.stroke();
        }

        for (let y = 0; y < canvasHeight; y += gridSize) {
          patternCtx.beginPath();
          patternCtx.moveTo(0, y);
          patternCtx.lineTo(canvasWidth, y);
          const colorIndex = Math.floor(Math.round((y / gridSize)) % 2);
          patternCtx.strokeStyle = color[colorIndex];
          patternCtx.stroke();
        }
        const patternDataUrl = patternCanvas.toDataURL('image/png');
        FabricImage.fromURL(patternDataUrl).then((img) => {
          canvas.backgroundImage = img;
          canvas.renderAll()
        })
      }

      const plotCanvas = new Canvas(plotterRef.current, {
        width: util.parseUnit(`420mm`),
        height: util.parseUnit(`300mm`),
        backgroundColor: "white",
        fireRightClick: true,
        stopContextMenu: true,
        centeredRotation: true,
        selectionDashArray: [10],
        selectionBorderColor: '#095262',
        selectionColor: '#4666ce40',
        controlsAboveOverlay: false,
      });

      setCanvasBackground(plotCanvas);
      setPlotterCanvas(plotCanvas);

      const fontUrl = fontTTF;

      const createGroupFromCanvas = async () => {
        const objects = canvas.getObjects();
        const clonedObjects = await Promise.all(objects.map((obj) => obj.clone()));
        const canvasBackground = new Rect({
          left: 0,
          top: 0,
          width: canvas.width,
          height: canvas.height,
          fill: 'transparent', 
          selectable: false,   
          evented: false,
          originX: 'left',
          originY: 'top',
          name: 'background',
          strokeWidth: 2,
          stroke: '#d3d3d3',
        });
        const group = new Group([canvasBackground], { interactive: false, originX: 'left', originY: 'top', backgroundColor: '#fff' });

        for (const obj of clonedObjects) {
          if (obj.type === 'i-text') {
            await processTextObject(obj, fontUrl, group);
          } else if (obj.type === 'group') {
            const groupObjects = [ ...obj.removeAll() ];
            group.add(...groupObjects)
          } else {
            obj.set({
              lockRotation: true, 
              lockScalingX: true,
              lockScalingY: true,
              borderDashArray: [13],
              cornerSize: 0,
              hasControls: false
            });
            group.add(obj)
          }
        }

        group.set({ top: 3, left: 3 })
        plotCanvas.add(group);       
        group.setCoords();
        plotCanvas.renderAll();
      }

      createGroupFromCanvas()

      return () => {
        plotCanvas.dispose();
        FabricObject.ownDefaults.hasControls = true;
        FabricObject.ownDefaults.borderDashArray = [0]
      }
    } else if (canvas){
      canvas.renderAll()
      transformRef.current.resetTransform();
    }
  }, [tool])

  useEffect(() => {
    // const fetchPenConfig = async () => {
    //   const response = await fetch(`http://${config.url}/penconfig`)
    //   if (response.ok) {
    //     const res = await response.json();
    //     console.log(res)
    //   }
    // }
    // fetchPenConfig()
  }, [])

  useEditorSetup(tool, strokeColor, element);

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
                initialScale={ tool === 'Plot' ? 0.43 : 0.6 } 
                initialPositionX={ tool === 'Plot' ? 300 : null }
                initialPositionY={ tool === 'Plot' ? 100 : null }
                maxScale={3}
                minScale={ tool === 'Plot' ? 0.43 : 0.5 } 
                limitToBounds={ tool === 'Plot' ? false : true }
                panning={{ excluded: ['fabricCanvas'], disabled: tool !== 'Plot' ? false : true }}
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
                  contentStyle={{
                    padding: tool === 'Plot' ? '' : '7rem'
                  }}
                >
                  <div 
                    className="machine-outer"
                    style={{ display: tool === 'Plot' ? 'block' : 'none' }}
                  >
                    <div className="left-corner"></div>
                    <div className="right-corner"></div>
                    <div className="machine-inner">
                      <div className="machine-bed">
                        <div className="machine-bed-outer">
                          <div className="lt-corner"></div>
                          <div className="rt-corner"></div>
                          <div className="lb-corner"></div>
                          <div className="rb-corner"></div>
                          <canvas ref={ plotterRef } className="fabricCanvas"></canvas>
                        </div>
                        <div className="triangle-left"></div>
                        <div className="triangle-right"></div>
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
                ${ expanded ? 'w-[45%] lg:w-[19%]' : 'w-[0]' } bg-white transition-all duration-500
                lg:border-l-2 ${ tool === 'Plot' ? 'border-[#1f5c98c2]' : 'border-[#1c7f969c]' }
              `}
            >
              <div className={ `sidebar h-full  transition-all duration-[2s] ${ expanded ? 'opacity-100 ' : 'opacity-0'}`}>
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

