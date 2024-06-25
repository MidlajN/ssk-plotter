/* eslint-disable react/prop-types */

import { useState } from "react";
import useCanvas from "./context.jsx";
import Sidebar, { SidebarItem } from "./components/sidebar";
import { Boxes, CaseSensitiveIcon, CloudUpload, Group, MousePointer2Icon, PenLine, PenTool, Spline } from "lucide-react";
import Container from "./components/container.jsx";
import { Default, Elements, FreeDraw, Import, TextBox } from "./components/editor/editor";
import { Cut } from "./components/cut/cut";
import { split, group, info } from "./components/editor/functions";
import { Setup } from "./components/setup/setup";


export default function Home() {
  const [tool, setTool] = useState('Select');
  const [ expanded, setExpanded ] = useState(false);
  const [ hideSideBar, setHideSideBar ] = useState(false);
  const [jobSetUp, setJobSetup] = useState([]);

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
              { tool === 'Select' && <Default /> }
              { tool === 'Elements' && <Elements /> }
              { tool === 'Pen' && <FreeDraw /> }
              { tool === 'Textbox' && <TextBox /> }
              { tool === 'Import' && <Import /> }
              { tool === 'Setup' && <Setup jobSetUp={jobSetUp} setJobSetup={setJobSetup} /> }
              { tool === 'Cut' && <Cut jobSetUp={jobSetUp} setJobSetup={setJobSetup} /> }
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
      <div className="px-16 w-full h-full flex justify-between items-center navDiv">
        <h3 className="py-5">Kochun<span>D</span></h3>
        <div className="buttonGroup px-[0.3rem] flex gap-4 items-center justify-around">
          <button 
            className={ tool !== 'Setup' && tool !== 'Cut' ? 'active' : ''}
            onClick={() => {
              setTool('Select');
              setExpanded(true);
              setHideSideBar(false);   
            }}
          > Editor </button>
          <button 
            className={ tool === 'Setup' ? 'active' : ''}
            onClick={() => {
              setTool('Setup');
              setExpanded(true);
              setHideSideBar(true);
            }}
          > Setup </button>
          <button
            className={ tool === 'Cut' ? 'active' : ''}
            onClick={() => {
              setExpanded(true);
              setHideSideBar(true);
              setTool('Cut')
            }}
          > Cut </button>
        </div>
      </div>
    </nav>
  )
}

const SideNav = ({ tool, setTool, setExpanded }) => {
  const { canvas } = useCanvas();
  return (
    <Sidebar>
      <SidebarItem 
        icon={ <MousePointer2Icon size={25} strokeWidth={1.5} color={ tool === 'Select' ? '#F5762E' : '#4b5563'} /> } 
        text={'Select'} 
        setTool={setTool} 
        setExpanded={setExpanded}
      />
      <SidebarItem 
        icon={ <Boxes size={25} strokeWidth={1.5} color={ tool === 'Elements' ? '#F5762E' : '#4b5563'}  /> } 
        text={'Elements'} 
        setTool={setTool}
        setExpanded={setExpanded}
        canvasFunction={info}
      />
      <SidebarItem 
        icon={ <Group size={25} strokeWidth={1.5} color={ tool === 'Group' ? '#F5762E' : '#4b5563'} /> } 
        text={'Group'} 
        setTool={setTool}
        setExpanded={setExpanded}
        canvasFunction={ () => group(canvas) }
      />
      <SidebarItem 
        icon={ <img src="/split.svg" alt="" /> } 
        text={'Split'} 
        setTool={setTool} 
        setExpanded={setExpanded}
        canvasFunction={ () => split(canvas) }
      />
      <SidebarItem 
        icon={ <Spline size={25} strokeWidth={1.5} color={ tool === 'Curves' ? '#F5762E' : '#4b5563'} /> } 
        text={'Curves'} 
        setTool={setTool}
        setExpanded={setExpanded}
      />
      <SidebarItem 
        icon={ <PenLine size={25} strokeWidth={1.5} color={ tool === 'Lines' ? '#F5762E' : '#4b5563'} /> } 
        text={'Lines'} 
        setTool={setTool} 
        setExpanded={setExpanded}
      />
      <SidebarItem 
        icon={ <PenTool size={25} strokeWidth={1.5} color={ tool === 'Pen' ? '#F5762E' : '#4b5563'} /> } 
        text={'Pen'} 
        setTool={setTool}
        setExpanded={setExpanded}
      />
      <SidebarItem 
        icon={ <CaseSensitiveIcon size={25} strokeWidth={1.5} color={ tool === 'Textbox' ? '#F5762E' : '#4b5563'} /> } 
        text={'Textbox'} 
        setTool={setTool} 
        setExpanded={setExpanded}
      />
      <SidebarItem 
        icon={ <CloudUpload size={25} strokeWidth={1.5} color={ tool === 'Import' ? '#F5762E' : '#4b5563'} /> } 
        text={'Import'} 
        setTool={setTool} 
        setExpanded={setExpanded}
      />
    </Sidebar>
  )
}