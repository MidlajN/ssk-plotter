/* eslint-disable react/prop-types */

import { useState, useEffect } from "react";
import Container from "./components/container.jsx";
import { Default, Import } from "./components/editor/editor";
import { Plot } from "./components/plot/plot.jsx";
import useCanvas from "./context.jsx";
import { SideNav } from "./components/sidebar";
import { fabric } from "fabric";
import './App.css';


export default function Home() {
  const { canvas } = useCanvas();
  const [tool, setTool] = useState('Select');
  const [ expanded, setExpanded ] = useState(false);
  const [ hideSideBar, setHideSideBar ] = useState(false);
  const [jobSetUp, setJobSetup] = useState([]);
  const [strokeColor, setStrokeColor] = useState('black');

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

      if (tool === 'Lines') {
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
    }
  },[tool, strokeColor])

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
              { (tool !== 'Import' && tool !== 'Plot') &&  <Default strokeColor={strokeColor} setStrokeColor={setStrokeColor} tool={tool}/>}
              {/* { tool === 'Select' && <Default strokeColor={strokeColor} setStrokeColor={setStrokeColor}/> } */}
              {/* { tool === 'Elements' && <Elements /> } */}
              {/* { tool === 'Elements' && <Default strokeColor={strokeColor} setStrokeColor={setStrokeColor} tool={'Elements'}/> } */}
              {/* { tool === 'Pen' && <Default strokeColor={strokeColor} setStrokeColor={setStrokeColor}/> } */}
              {/* { tool === 'Lines' && <Default strokeColor={strokeColor} setStrokeColor={setStrokeColor}/> } */}
              {/* { tool === 'Textbox' && <TextBox /> } */}
              { tool === 'Import' && <Import /> }
              {/* { tool === 'Setup' && <Setup jobSetUp={jobSetUp} setJobSetup={setJobSetup} /> } */}
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

