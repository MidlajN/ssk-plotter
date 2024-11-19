/* eslint-disable react/prop-types */
import useCanvas from "../../context/CanvasContext";
import { split, group } from "../../util/functions";
import { FreeDrawIcon, SplitSvg } from "../Icons";
import { Line } from "./Icons";
import './nav.css';
import { Circle, Group, MousePointer2Icon, Square, Triangle } from "lucide-react";

export const SideNav = ({ tool, setTool, setExpanded, element,  setElement }) => {
  const { canvas, saveState } = useCanvas();
  return (
    <Sidebar>
      <SidebarItem 
        icon={ <MousePointer2Icon size={22} strokeWidth={1.5} color={ tool === 'Select' ? '#1c8096' : '#4b5563' } /> } 
        text={'Select'} 
        setTool={setTool} 
        setExpanded={setExpanded}
      />
      {/* <SidebarItem 
        icon={ <PenLine size={22} strokeWidth={1.5} color={ tool === 'Lines' ? '#1c8096' : '#4b5563'} /> } 
        text={'Lines'} 
        setTool={setTool} 
        setExpanded={setExpanded}
      /> */}
      {/* <SidebarItem 
        icon={ <PenTool size={22} strokeWidth={1.5} style={{ rotate: '-90deg'}} color={ tool === 'Pen' ? '#1c8096' : '#4b5563'} /> } 
        text={'Pen'} 
        setTool={setTool}
        setExpanded={setExpanded}
      /> */}
      <SidebarItem 
        icon={ <FreeDrawIcon size={22} strokeWidth={1.5} color={ tool === 'Pen' ? '#1c8096' : '#4b5563'} /> } 
        text={'Pen'} 
        setTool={setTool}
        setExpanded={setExpanded}
      />
      <SidebarItem 
        // icon={ <Minus size={22} strokeWidth={1.5} style={{ rotate: '-45deg'}} color={ tool === 'Lines' ? '#1c8096' : '#4b5563' } /> } 
        icon={ <Line size={22} strokeWidth={1.5} color={ tool === 'Lines' ? '#1c8096' : '#4b5563' } /> } 
        text={'Lines'} 
        setTool={setTool}
        setExpanded={setExpanded}
        // canvasFunction={ () => setElement('Line') }
      />
      <SidebarItem 
        icon={ <Square size={22} strokeWidth={1.5} color={ ( tool === 'Elements' && element === 'rectangle' ) ? '#1c8096' : '#4b5563' } /> } 
        text={'Elements'} 
        hoverText={'Rectangle'}
        setTool={setTool}
        setExpanded={setExpanded}
        canvasFunction={ () => setElement('rectangle') }
      />
       <SidebarItem 
        icon={ <Circle size={22} strokeWidth={1.5} color={ (tool === 'Elements' && element === 'circle') ? '#1c8096' : '#4b5563' } /> } 
        text={'Elements'} 
        hoverText={'Circle'}
        setTool={setTool}
        setExpanded={setExpanded}
        canvasFunction={ () => setElement('circle') }
      />
      <SidebarItem 
        icon={ <Triangle size={22} strokeWidth={1.5} color={ (tool === 'Elements' && element === 'triangle') ? '#1c8096' : '#4b5563' }  /> } 
        text={'Elements'} 
        hoverText={'Triangle'}
        setTool={setTool}
        setExpanded={setExpanded}
        canvasFunction={ () => setElement('triangle') }
      />
      <SidebarItem 
        icon={ <Group size={22} strokeWidth={1.5} color={ tool === 'Group' ? '#1c8096' : '#4b5563' } /> } 
        text={'Group'} 
        setTool={setTool}
        setExpanded={setExpanded}
        canvasFunction={ () => group(canvas, saveState) }
      />
      <SidebarItem 
        icon={ <SplitSvg /> } 
        text={'Split'} 
        setTool={setTool} 
        setExpanded={setExpanded}
        canvasFunction={ () => split(canvas, saveState) }
      />
      {/* <SidebarItem 
        icon={ <Spline size={22} strokeWidth={1.5} color={ tool === 'Curves' ? '#1c8096' : '#4b5563'} /> } 
        text={'Curves'} 
        setTool={setTool}
        setExpanded={setExpanded}
      /> */}
      {/* <SidebarItem 
        icon={ <CloudUpload size={22} strokeWidth={1.5} color={ tool === 'Import' ? '#1c8096' : '#4b5563'} /> } 
        text={'Import'} 
        setTool={setTool} 
        setExpanded={setExpanded}
      /> */}
    </Sidebar>
  )
}


export default function Sidebar({ children }) {
return (
    <aside 
      className="
        h-full min-w-14 max-[900px]:h-fit max-[900px]:absolute max-[900px]:z-50 
        top-[50%] max-[900px]:transform max-[900px]:-translate-y-[50%] max-[900px]:left-1 
        transition-all duration-500
      "> 
      <nav className="h-full flex flex-col rounded-lg border border-[#1c809681] bg-white border-r shadow-sm">
          <ul className="flex-1 py-2">{children}</ul>
      </nav>
    </aside>
)
}

export function SidebarItem({ icon, text, setTool, setExpanded, canvasFunction, hoverText = null }) {
    
    return (
        <li
            className={`
                relative flex items-center justify-center py-4 px-5 w-full my-1
                font-medium cursor-pointer transition-colors group 
                text-nowrap 
            `}
            onClick={ () => {
                const expandTool = ['Group', 'Split'];
                const simpleTool = ['Lines', 'Curves'];

                if (expandTool.includes(text)) {
                    // setTool(null);
                    // setExpanded(true);
                } else if (simpleTool.includes(text)) {
                    setTool(text);
                    setExpanded(true);
                } else {
                    setTool(text);
                    setExpanded(true)
                }
                
                if (canvasFunction) canvasFunction();
            }}
        >
            {icon}
            <div
                className={`
                    absolute z-10 md:left-full rounded-md px-2 py-1 lg:ml-6 bg-orange-100 text-orange-800 text-sm invisible opacity-20 
                    lg:translate-y-0 lg:-translate-x-3 -translate-x-1/2 group-hover:-translate-y-2 -bottom-4 lg:bottom-auto transition-all
                    group-hover:visible group-hover:opacity-100 lg:group-hover:translate-x-0 lg:group-hover:translate-y-0
                `}
            >
                { hoverText ? hoverText : text }
            </div>

        </li>
    )
}
