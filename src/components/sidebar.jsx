/* eslint-disable react/prop-types */

export default function Sidebar({ children }) {
return (
    <aside className="h-full w-[3%%] max-[900px]:h-fit max-[900px]:absolute max-[900px]:z-50 top-[50%] max-[900px]:transform max-[900px]:-translate-y-[50%] max-[900px]:left-1 transition-all duration-500"> 
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
                text-nowrap hover:bg-orange-50"
                }
            `}
            onClick={ () => {
                const expandTool = ['Group', 'Split'];
                const simpleTool = ['Lines', 'Curves'];

                if (expandTool.includes(text)) {
                    // setTool(null);
                    // setExpanded(true);
                } else if (simpleTool.includes(text)) {
                    // setTool(text);
                    setExpanded(false);
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
                    absolute z-10 left-full rounded-md px-2 py-1 ml-6
                    bg-orange-100 text-orange-800 text-sm
                    invisible opacity-20 -translate-x-3 transition-all
                    group-hover:visible group-hover:opacity-100 group-hover:translate-x-0
                `}
            >
                {text}
            </div>

        </li>
    )
}