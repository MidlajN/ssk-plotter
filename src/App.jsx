/* eslint-disable react/prop-types */

import { useState, useEffect } from "react";
import Container from "./components/container.jsx";
import { Default, Import } from "./components/editor/editor";
import { Plot } from "./components/plot/plot.jsx";
import useCanvas from "./context.jsx";
import { SideNav } from "./components/sidebar";
import { fabric } from "fabric";
import { prebuiltComponents } from "./components/editor/components.jsx";
import './App.css';


export default function Home() {
  const { canvas } = useCanvas();
  const [tool, setTool] = useState('Select');
  const [ expanded, setExpanded ] = useState(false);
  const [ hideSideBar, setHideSideBar ] = useState(false);
  const [jobSetUp, setJobSetup] = useState([]);
  const [strokeColor, setStrokeColor] = useState('black');
  const [element, setElement] = useState('rectangle')

  useEffect(() => {
    if (canvas) {
      if (tool === 'Pen') {
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush.color = strokeColor;
        canvas.freeDrawingBrush.width = 3;
        
        return () => {
          canvas.isDrawingMode = false;
        }
      }

      else if (tool === 'Lines') {
        console.log('Toole Is SELECTED')
        let line;
        let mouseDown = false;

        canvas.selection = false;
        canvas.hoverCursor = 'auto';
        canvas.getObjects().forEach(obj => {
          obj.set({
            selectable: false
          })
        })
        canvas.on('mouse:down', (event) => {
            let pointer = canvas.getPointer(event.e)

            if (!mouseDown) {
              mouseDown = true
              line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                id: 'added-line',
                strokeWidth: 3,
                stroke: strokeColor,
                selectable: false
              })
              canvas.add(line)
              canvas.requestRenderAll()
            }
        })
        canvas.on('mouse:move', (event) => {
          if (mouseDown) {
            let pointer = canvas.getPointer(event.e)
            line.set({ 
              x2: pointer.x, 
              y2: pointer.y 
            })
            canvas.requestRenderAll()
          }
        })
        canvas.on('mouse:up', () => {
          line.setCoords()
          mouseDown = false;
        })

        return () => {
          canvas.selection = true;
          canvas.hoverCursor = 'all-scroll';

          canvas.getObjects().forEach(obj => {
            obj.set({
              selectable: true
            })
          })

          canvas.off('mouse:down');
          canvas.off('mouse:move');
          canvas.off('mouse:up');
        }
      }

      else if (tool === 'Elements') {
        let object;
        let mouseDown = false;
        let startPointer;

        if (canvas && tool === 'Elements') {
            console.log('Effect : Elements -> Mounted..')
            canvas.selection = false;
            canvas.hoverCursor = 'auto';
            canvas.getObjects().forEach(obj => {
                obj.set({
                    selectable: false
                })
            })

            canvas.on('mouse:down', (event) => {
                mouseDown = true;
                startPointer = canvas.getPointer(event.e)

                object = new prebuiltComponents[element].constructor({
                    ...prebuiltComponents[element].toObject(),
                    left: startPointer.x,
                    top: startPointer.y,
                    selectable: false
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
                    canvas.renderAll();
                }
            })

            canvas.on('mouse:up', () => {
                object.setCoords();
                mouseDown = false;
            })

            return () => {
                console.log('EFFECT UNMOUNT')
                canvas.selection = true,
                canvas.hoverCursor = 'all-scroll';
                canvas.getObjects().forEach(obj => {
                    obj.set({
                        selectable: true
                    })
                })

                canvas.off('mouse:do|wn');
                canvas.off('mouse:move');
                canvas.off('mouse:up');
            };
        }
      }
    }
  },[tool, strokeColor, canvas, element])

  return (
    <>
      <section className="h-screen">
        <NavBar 
          tool={ tool } 
          setTool={ setTool } 
          setExpanded={ setExpanded } 
          setHideSideBar={ setHideSideBar } 
        />

        <div className="flex h-[91%]"> 
          { !hideSideBar && <SideNav tool={ tool } setTool={ setTool } setExpanded={ setExpanded } /> }

          <Container expanded={ expanded } setExpanded={ setExpanded } hideSideBar={ hideSideBar }>
            <div className={ `h-full py-5 px-5 transition-all ${ expanded ? 'opacity-100 duration-[2s]' : 'opacity-0'}`}>
              { (tool !== 'Import' && tool !== 'Plot') &&  <Default strokeColor={strokeColor} setStrokeColor={setStrokeColor} tool={tool} element={element} setElement={setElement}/>}
              { tool === 'Import' && <Import /> }
              { tool === 'Plot' && <Plot jobSetUp={jobSetUp} setJobSetup={setJobSetup} /> }
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
        <h3 className="py-5 text-3xl">Tinker<span className="text-4xl">Plot</span></h3>
        <div className="buttonGroup px-[0.3rem] flex gap-4 items-center justify-around">
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
              setTool('Plot')
            }}
          > Plot </button>
        </div>
      </div>
    </nav>
  )
}

