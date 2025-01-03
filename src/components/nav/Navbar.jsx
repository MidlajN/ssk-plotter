import './nav.css'

// eslint-disable-next-line react/prop-types
export const NavBar = ({ tool, setTool, setExpanded, setHideSideBar }) => {
    return (
      <nav className="navbar h-[9%]">
        <div className={`lg:px-16 navDiv border-b-2 ${ tool === 'Plot' ? 'border-[#1f5c98c2]' : 'border-[#1c809681]' }`}>
          <h3 className="py-5 text-3xl">PLOT<span className="name text-4xl">CEI</span> <span className='text-xs text-gray-500'> {tool === 'Plot' ? 'Plotter' : 'Editor' }</span></h3>
          <div className="buttonGroup px-[0.3rem] md:flex gap-4 items-center justify-around absolute left-1/2 -translate-x-1/2">
            <button 
              className={`transition-all duration-500 ${tool !== 'Setup' && tool !== 'Plot' ? 'active bg-[#1c8096]' : ''}`}
              onClick={() => {
                setTool('Select');
                setExpanded(true);
                setHideSideBar(false);   
              }}
            > Editor </button>
            <button
              className={`transition-all duration-500 ${ tool === 'Plot' ? 'active bg-[#1f5c98c2]' : '' }`}
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
  
  
  