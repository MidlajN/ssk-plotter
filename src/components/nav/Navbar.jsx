import './nav.css'

// eslint-disable-next-line react/prop-types
export const NavBar = ({ tool, setTool, setExpanded, setHideSideBar }) => {
    return (
      <nav className="navbar h-[9%]">
        <div className={`lg:px-16 navDiv border-b-2 ${ tool === 'Plot' ? 'border-[#9c3c6e7c]' : 'border-[#1c809681]' }`}>
          <h3 className="py-5 text-3xl">PLOT<span className="text-4xl">CEI</span></h3>
          <div className="buttonGroup px-[0.3rem] md:flex gap-4 items-center justify-around absolute left-1/2 -translate-x-1/2">
            <button 
              className={ tool !== 'Setup' && tool !== 'Plot' ? 'active bg-[#1c8096]' : ''}
              onClick={() => {
                setTool('Select');
                setExpanded(true);
                setHideSideBar(false);   
              }}
            > Editor </button>
            <button
              className={ tool === 'Plot' ? 'active bg-[#cf5896d7]' : ''}
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
  
  
  