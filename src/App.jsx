/* eslint-disable react/prop-types */

import { useState, useEffect } from "react";
import Container from "./components/container.jsx";
import { Default, Import } from "./components/editor/editor";
import { Plot } from "./components/plot.jsx";
import useCanvas, { useCom } from "./context.jsx";
import { BottomNav, SideNav } from "./components/sidebar";
import { Line, PencilBrush } from "fabric";
import { prebuiltComponents } from "./components/editor/components.jsx";
import { PenTool, Pencil } from "lucide-react";
import { componentToUrl } from "./components/editor/functions.jsx";

export default function Home() {
  const { canvas, saveState, toolRef } = useCanvas();
  const [ tool, setTool ] = useState('Select');
  const [ expanded, setExpanded ] = useState(false);
  const [ hideSideBar, setHideSideBar ] = useState(false);
  const [ strokeColor, setStrokeColor ] = useState('#5e5e5e');
  const [ element, setElement ] = useState('rectangle');

  // ---- For Debug Purposes ----
  const { setResponse, response } = useCom();
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

          <Container expanded={ expanded } setExpanded={ setExpanded } hideSideBar={ hideSideBar }>
            <BottomNav tool={tool} setExpanded={setExpanded} setTool={setTool} />

            <div className={ `h-full transition-all duration-[2s] overflow-hidden ${ expanded ? 'opacity-100 ' : 'opacity-0'}`}>
              { (tool !== 'Import' && tool !== 'Plot') &&  <Default strokeColor={strokeColor} setStrokeColor={setStrokeColor} tool={tool} element={element} setElement={setElement} />}
              { tool === 'Import' && <Import /> }
              { tool === 'Plot' && <Plot /> }
            </div>
          </Container>
        </div>
      </section>
    </>
  )
}

const NavBar = ({ tool, setTool, setExpanded, setHideSideBar }) => {
  return (
    <nav className="navbar h-[9%]">
      <div className="px-8 lg:px-16 w-full h-full flex justify-between items-center navDiv">
        <h3 className="py-5 text-3xl">PLOT<span className="text-4xl">CEI</span></h3>
        <div className="buttonGroup px-[0.3rem] md:flex gap-4 items-center justify-around">
          <button 
            className={ tool !== 'Setup' && tool !== 'Plot' ? 'active' : ''}
            onClick={() => {
              setTool('Select');
              setExpanded(true);
              setHideSideBar(false);   
            }}
          > Editor </button>
          <button
            className={ tool === 'Plot' ? 'active' : ''}
            onClick={() => {
              setExpanded(true);
              setHideSideBar(true);
              setTool('Plot');
            }}
          > Plot </button>
        </div>
      </div>
    </nav>
  )
}


const useEditorSetup = (canvas, tool, strokeColor, element, saveState, toolRef) => {

  useEffect(() => {
    if (!canvas) return;

    canvas.mode = tool;
    toolRef.current = tool;

    const resetCanvas = () => {
      canvas.selection = true;
      canvas.hoverCursor = 'all-scroll';
      canvas.defaultCursor = 'auto';

      canvas.getObjects().forEach(obj => {
        if (obj.name !== 'ToolHead' && obj.name !== 'BedSize' ) {
          obj.set({
            selectable: true
          })
        }
      });

      canvas.off('mouse:down');
      canvas.off('mouse:move');
      canvas.off('mouse:up');
    }

    const commonSetup = (cursor = 'auto') => {
      canvas.selection = false;
      canvas.hoverCursor = cursor;
      canvas.getObjects().forEach(obj => {
        obj.set({
          selectable: false
        })
      });
    }

    if (tool === 'Pen') {
      console.log('strokeColor : ', strokeColor)
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush = new PencilBrush(canvas);
      canvas.freeDrawingBrush.color = strokeColor;
      canvas.freeDrawingBrush.width = 3;

      const customCursor = componentToUrl(PenTool, 0);
      canvas.freeDrawingCursor = `url(${ customCursor }), auto`;

      return () => { 
        canvas.isDrawingMode = false; 
      };
    }

    if (tool === 'Lines') {
      const customCursor = componentToUrl(Pencil, 90);
      canvas.defaultCursor = `url(${ customCursor }), auto`;
      commonSetup(`url(${ customCursor }), auto`);

      let line;
      let mouseDown = false;

      canvas.on('mouse:down', (event) => {
        canvas.off('object:added', saveState)
        const pointer = canvas.getPointer(event.e);

        if (!mouseDown) {
          mouseDown = true;
          line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
            id: 'added-line',
            stroke: strokeColor,
            strokeWidth: 3,
            selectable: false
          })
          canvas.add(line);
          canvas.requestRenderAll();
        }
      });

      canvas.on('mouse:move', (event) => {
        const isCtrlPressed = event.e.ctrlKey;

        if (mouseDown) {
          const pointer = canvas.getPointer(event.e);
          if (isCtrlPressed) {
            if (pointer.x < line.x1 + 100 && pointer.x > line.x1 - 100 && line.height >  100 ) pointer.x = line.x1;
            if (pointer.y < line.y1 + 100 && pointer.y > line.y1 - 100  && line.width >  100) pointer.y = line.y1
          }
          line.set({ x2: pointer.x , y2: pointer.y });
          canvas.requestRenderAll();
        }
      });

      canvas.on('mouse:up', () => {
        line.setCoords();
        mouseDown = false;
        canvas.on('object:added', saveState)
        canvas.fire('object:modified', { target: line });
      });

      return resetCanvas;
    }

    if (tool === 'Elements') {
      commonSetup();
      let object;
      let mouseDown = false;
      let startPointer;

      canvas.on('mouse:down', (event) => {
        canvas.off('object:added', saveState)
        mouseDown = true;
        startPointer = canvas.getPointer(event.e);

        object = new prebuiltComponents[element].constructor({
          ...prebuiltComponents[element].toObject(),
          left: startPointer.x,
          top: startPointer.y,
          selectable: false,
          stroke: strokeColor
        });

        canvas.add(object);
      })

      canvas.on('mouse:move', (event) => {
        if (mouseDown && object) {
          const pointer = canvas.getPointer(event.e);
          const width = Math.abs(pointer.x - startPointer.x);
          const height = Math.abs(pointer.y - startPointer.y);

          if (object.type === 'rect' || object.type === 'triangle') {
            object.set({ width: width, height: height });
            if (pointer.x < startPointer.x) object.set({ left: pointer.x });
            if (pointer.y < startPointer.y) object.set({ top: pointer.y });
          } else if (object.type === 'ellipse') {
            object.set({ rx: width / 2, ry: height / 2 });
            if (pointer.x < startPointer.x) object.set({ left: pointer.x });
            if (pointer.y < startPointer.y) object.set({ top: pointer.y });
          }
          canvas.requestRenderAll();
        }
      });

      canvas.on('mouse:up', () => {
        canvas.on('object:added', saveState)
        object.setCoords();
        mouseDown = false;
        canvas.fire('object:modified', { target: object });
      });

      return resetCanvas;
    }
  }, [canvas, element, saveState, strokeColor, tool])
}
