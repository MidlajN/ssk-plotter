/* eslint-disable react/prop-types */

import { useState, useEffect } from "react";
import Container from "./components/container.jsx";
import { Default, Import } from "./components/editor/editor";
import { Plot } from "./components/plot.jsx";
import useCanvas, { useCom } from "./context.jsx";
import { SideNav } from "./components/sidebar";
import { Line } from "fabric";
import { prebuiltComponents } from "./components/editor/components.jsx";
import { SidebarItem } from "./components/sidebar";
import { CloudUpload, MousePointer2Icon, Boxes, Group, PenLine, PenTool, Pencil } from "lucide-react";
import { split, group } from "./components/editor/functions.jsx";
import { componentToUrl } from "./components/editor/functions.jsx";
import { SplitSvg } from "./components/icons.jsx";

export default function Home() {
  const { canvas } = useCanvas();
  const [ tool, setTool ] = useState('Select');
  const [ expanded, setExpanded ] = useState(false);
  const [ hideSideBar, setHideSideBar ] = useState(false);
  const [ strokeColor, setStrokeColor ] = useState('#5e5e5e');
  const [ element, setElement ] = useState('rectangle');

  // ---- For Debug Purposes ----
  const { setResponse, response } = useCom();
  useEffect(() => {
    setResponse({ ...response, pageId: 0 })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEditorSetup(canvas, tool, strokeColor, element);

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
            <div className={`p-5 overflow-x-scroll no-scrollbar flex gap-[1px] items-center lg:hidden ${ tool !== 'Plot' ? '' : 'hidden' }`}>
              <div className="bg-slate-300 rounded-s-md">
                <SidebarItem 
                  icon={ <MousePointer2Icon size={25} strokeWidth={2.3} color={ tool === 'Select' ? '#1c8096' : '#4b5563'} /> } 
                  text={'Select'} 
                  setTool={setTool} 
                  setExpanded={setExpanded}
                />
              </div>
              <div className="bg-slate-200">
                <SidebarItem 
                  icon={ <PenLine size={25} strokeWidth={2.3} color={ tool === 'Lines' ? '#1c8096' : '#4b5563'} /> } 
                  text={'Lines'} 
                  setTool={setTool} 
                  setExpanded={setExpanded}
                />
              </div>
              <div className="bg-slate-200">
                <SidebarItem 
                  icon={ <PenTool size={25} strokeWidth={2} color={ tool === 'Pen' ? '#1c8096' : '#4b5563'} /> } 
                  text={'Pen'} 
                  setTool={setTool}
                  setExpanded={setExpanded}
                />
              </div>
              <div className="bg-slate-200">
                <SidebarItem 
                  icon={ <Boxes size={25} strokeWidth={1.8} color={ tool === 'Elements' ? '#1c8096' : '#4b5563'}  /> } 
                  text={'Elements'} 
                  setTool={setTool}
                  setExpanded={setExpanded}
                  // canvasFunction={ () => info(canvas) }
                />
              </div>
              <div className="bg-slate-200">
                <SidebarItem 
                  icon={ <Group size={25} strokeWidth={2.2} color={ tool === 'Group' ? '#1c8096' : '#4b5563'} /> } 
                  text={'Group'} 
                  setTool={setTool}
                  setExpanded={setExpanded}
                  canvasFunction={ () => group(canvas) }
                />
              </div>
              <div className="bg-slate-200">
                <SidebarItem 
                  icon={ <SplitSvg /> } 
                  text={'Split'} 
                  setTool={setTool} 
                  setExpanded={setExpanded}
                  canvasFunction={ () => split(canvas) }
                />
              </div>
              
              <div className="bg-slate-200 rounded-e-md">
                <SidebarItem 
                  icon={ <CloudUpload size={25} strokeWidth={2} color={ tool === 'Import' ? '#1c8096' : '#4b5563'} /> } 
                  text={'Import'} 
                  setTool={setTool} 
                  setExpanded={setExpanded}
                />
              </div>
            </div>
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


const useEditorSetup = (canvas, tool, strokeColor, element) => {
  useEffect(() => {
    if (!canvas) return;

    canvas.mode = tool;

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
      canvas.isDrawingMode = true;
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
      });

      return resetCanvas;
    }

    if (tool === 'Elements') {
      commonSetup();
      let object;
      let mouseDown = false;
      let startPointer;

      canvas.on('mouse:down', (event) => {
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
        object.setCoords();
        mouseDown = false;
      });

      return resetCanvas;
    }
  }, [canvas, element, strokeColor, tool])
}
