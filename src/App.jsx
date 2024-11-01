/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */

import { useState } from "react";
import Container from "./components/container.jsx";
import { Default, Import } from "./components/editor/editor";
import { Plot } from "./components/plotter/plot.jsx";
import useCanvas from "./context/CanvasContext.jsx";
import { BottomNav, SideNav } from "./components/nav/Sidebar.jsx";
import { useEditorSetup } from "./components/editor/useEditorSetup.jsx";
import { NavBar } from "./components/nav/Nav.jsx";

export default function Home() {
  const { canvas, saveState, toolRef } = useCanvas();
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

