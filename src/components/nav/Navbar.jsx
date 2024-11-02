import './nav.css'

// eslint-disable-next-line react/prop-types
export const NavBar = ({ tool, setTool, setExpanded, setHideSideBar }) => {
    return (
      <nav className="navbar h-[9%]">
        <div className="px-8 lg:px-16 w-full h-full flex justify-between items-center navDiv">
          <h3 className="py-5 text-3xl">PLOT<span className="text-4xl">CEI</span></h3>
          <div className="buttonGroup px-[0.3rem] md:flex gap-4 items-center justify-around">
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
                setTool('Plot');
              }}
            > Plot </button>
          </div>
        </div>
      </nav>
    )
  }
  
  
  