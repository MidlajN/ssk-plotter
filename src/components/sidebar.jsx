/* eslint-disable react/prop-types */
import useCanvas from "../context";
import { Boxes, CloudUpload, Group, MousePointer2Icon, PenLine, PenTool } from "lucide-react";
import { split, group, info } from "../components/editor/functions";

export const SideNav = ({ tool, setTool, setExpanded }) => {
    const { canvas } = useCanvas();
    return (
      <Sidebar>
        <SidebarItem 
          icon={ <MousePointer2Icon size={25} strokeWidth={1.5} color={ tool === 'Select' ? '#1c8096' : '#4b5563'} /> } 
          text={'Select'} 
          setTool={setTool} 
          setExpanded={setExpanded}
        />
        <SidebarItem 
          icon={ <Boxes size={25} strokeWidth={1.5} color={ tool === 'Elements' ? '#1c8096' : '#4b5563'}  /> } 
          text={'Elements'} 
          setTool={setTool}
          setExpanded={setExpanded}
          canvasFunction={ () => info(canvas) }
        />
        <SidebarItem 
          icon={ <Group size={25} strokeWidth={1.5} color={ tool === 'Group' ? '#1c8096' : '#4b5563'} /> } 
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
        {/* <SidebarItem 
          icon={ <Spline size={25} strokeWidth={1.5} color={ tool === 'Curves' ? '#1c8096' : '#4b5563'} /> } 
          text={'Curves'} 
          setTool={setTool}
          setExpanded={setExpanded}
        /> */}
        <SidebarItem 
          icon={ <PenLine size={25} strokeWidth={1.5} color={ tool === 'Lines' ? '#1c8096' : '#4b5563'} /> } 
          text={'Lines'} 
          setTool={setTool} 
          setExpanded={setExpanded}
        />
        <SidebarItem 
          icon={ <PenTool size={25} strokeWidth={1.5} color={ tool === 'Pen' ? '#1c8096' : '#4b5563'} /> } 
          text={'Pen'} 
          setTool={setTool}
          setExpanded={setExpanded}
        />
        {/* <SidebarItem 
          icon={ <CaseSensitiveIcon size={25} strokeWidth={1.5} color={ tool === 'Textbox' ? '#1c8096' : '#4b5563'} /> } 
          text={'Textbox'} 
          setTool={setTool} 
          setExpanded={setExpanded}
        /> */}
        <SidebarItem 
          icon={ <CloudUpload size={25} strokeWidth={1.5} color={ tool === 'Import' ? '#1c8096' : '#4b5563'} /> } 
          text={'Import'} 
          setTool={setTool} 
          setExpanded={setExpanded}
        />
      </Sidebar>
    )
  }

export default function Sidebar({ children }) {
return (
    <aside 
      className="
        h-full w-[3%] min-w-14 max-[900px]:h-fit max-[900px]:absolute max-[900px]:z-50 
        top-[50%] max-[900px]:transform max-[900px]:-translate-y-[50%] max-[900px]:left-1 
        transition-all duration-500
      "> 
    <nav className="h-full flex flex-col bg-white border-r shadow-sm">
        <ul className="flex-1 py-2">{children}</ul>
    </nav>
    </aside>
)
}

export function SidebarItem({ icon, text, setTool, setExpanded, canvasFunction }) {
    
    return (
        <li
            className={`
                relative flex items-center py-4 px-5 w-full my-1
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
                    absolute z-10 md:left-full rounded-md px-2 py-1 ml-6
                    bg-orange-100 text-orange-800 text-sm
                    invisible opacity-20 md:-translate-x-3 transition-all
                    group-hover:visible group-hover:opacity-100 md:group-hover:translate-x-0 
                    -bottom-4 md:bottom-auto -translate-x-1/2
                `}
            >
                {text}
            </div>

        </li>
    )
}