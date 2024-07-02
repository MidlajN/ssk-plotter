/* eslint-disable react/prop-types */

import { useState } from "react";
import Container from "./components/container.jsx";
import { Default, Elements, FreeDraw, Import, TextBox } from "./components/editor/editor";
import { Cut } from "./components/cut/cut";

import { Setup } from "./components/setup/setup";
import { SideNav } from "./components/sidebar";
import './App.css';


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
      <div className="px-8 lg:px-16 w-full h-full flex justify-between items-center navDiv">
        <h3 className="py-5 text-3xl">Kochun<span className="text-4xl">D</span></h3>
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

