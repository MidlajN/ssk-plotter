/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { 
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Home,
    Power,
    Dot,
    FileCog,
    Plug
} from "lucide-react";
import useCanvas from "../../context";
import './cut.css';
import { SetupModal } from "../modal";
import tinycolor from "tinycolor2";
import { Converter } from "svg-to-gcode";


export const Plot = () => {
    const { canvas } = useCanvas();
    const textareaRef = useRef(null)
    const gcodeRef = useRef(null)
    const [ controllers, setControllers ] = useState({x: 0, y: 0});
    const [ response, setResponse ] = useState({ visible: false, message: '' });
    const [ ws, setWs ] = useState(null);
    const [ setupModal, setSetupModal ] = useState(false);


    const handleConnection = async () => {
        setSetupModal(true)
    }

    const closeConnection = () => {
        ws.close();
        setWs(null);
    }

    const plot =  async () => {
        const objects = canvas.getObjects();
        const colorCommand = {
            "#ff0000" : "M03 S1", // Red
            "#0000ff" : "M03 S2", // Blue
            "#008000" : "M03 S3", // Green
            "#ffff00" : "M03 S4", // Yellow
            "#ffa500" : "M03 S5", // Orange
            "#800080" : "M03 S6", // Purple
            "#000000" : "M03 S7", // Black
            "#ffc0cb" : "M03 S8", // Pink
        }

        const svgElements = objects.map(obj => {
            const objSvg = obj.toSVG();
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', `0 0 ${ canvas.getWidth() } ${ canvas.getHeight() }`);
            svg.innerHTML = objSvg;
            const color = tinycolor(obj.stroke);

            return {
                color: color.toHexString(),
                svg: svg.outerHTML
            }
        });

        const converter = new Converter();
        const gcodes = await Promise.all(svgElements.map( async (element) => {
            const [ code ] = await converter.convert(element.svg);
            const gCodeLines = code.split('\n');
            const cleanedGcodeLines = gCodeLines.slice(0, -5);
            return [ colorCommand[element.color] + cleanedGcodeLines.join('\n')];
        }));

        console.log('Converted GCode -> \n', gcodes);

        // Send to Machine
        const blob = new Blob([gcodes.join('\n')], { type: 'text/plain' });
        const file = new File([blob], 'job.gcode', { type: 'text/plain' });

        const formData = new FormData();
        formData.append('file', file);
        
        try {
            const response = await fetch('http://192.168.0.1/upload', {
                method: 'POST',
                body: formData,
            });

            const result = await response.json();
            console.log('File Upload Finished -> ', result, response.status);

            if (response.status === 200) {
                const response = await fetch(`http://localhost:5000/command?commandText=[ESP220]/${file.name}`);
                setJobStarted(true);
                console.log(response);
            }
        } catch (err) {
            console.log('Error While Uploading -> ', err);
        }
    }



    const sendToMachine = async (gcode) => {
        try {

            const http = new XMLHttpRequest();
            http.onreadystatechange = () => {
                if (http.readyState === 4) {
                    console.log(http);
                    if (http.status === 200) {
                        console.log(http.responseText); // Log the response from ESP_GRBL server
                    }
                }
            }
            http.open("GET", "http://192.168.0.1/command?commandText=" + encodeURI(gcode), true);
            http.send();

        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        canvas.selection = false;
        canvas.getObjects().forEach((obj) => {
            obj.set({
                selectable: false
            })
        })
        canvas.requestRenderAll();

        return () => {
            canvas.selection = true;
            canvas.getObjects().forEach(obj => {
                obj.set({
                    selectable: true
                })
            })
        }
    }, [canvas]);


     // Scroll the textarea to the bottom when it overflows
    useEffect(() => {
        if ( textareaRef.current ) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [response.message]);


    return (
        <div className="flex justify-between gap-8 flex-col h-full pb-6">
            <div className="mt-4 h-full bg-[#EBEBEB] cut hidden md:block">
                <div className="w-full h-[10%] bg-[#1e263f] flex items-end justify-end gap-3 p-3">
                <FileCog size={20} strokeWidth={2} color={'#ffffff'}  /> 
                </div>
                <div className="text-sm responses h-[90%] relative">
                    <textarea ref={textareaRef} defaultValue={ response.message } ></textarea>
                    <div className="absolute w-full bottom-0 left-0 p-3">
                        <input 
                            ref={ gcodeRef }
                            className="w-full bg-[#1e263f] p-2 border border-[#ffffff69] outline-none text-sm" 
                            placeholder="Enter You G-Code here" 
                            onKeyDown={ (e) => {
                                if (e.key === 'Enter') {
                                    const value = gcodeRef.current.value;
                                    sendToMachine(value)
                                    gcodeRef.current.value = '';
                                }
                            }}
                        />
                    </div>
                </div>
            </div>
            <div className="flex flex-col items-center justify-center gap-5">
                <div className="flex flex-col items-center justify-center gap-3 pb-10">
                    <button 
                        className="p-3 bg-[#1C274C] rounded"
                        onClick={ () => {
                            // sendToMachine(`G00 X${controllers.x} Y${controllers.y}`);
                            sendToMachine(`G91 G21  F4000 Y10`);
                            setControllers({...controllers, y: controllers.y + 10});
                        }}
                        >
                        <ChevronUp size={20} strokeWidth={4} color={'#F5762E'}/>
                    </button>
                    <div className="flex gap-3">
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => {
                                // sendToMachine(`G00 X${controllers.x} Y${controllers.y}`);
                                sendToMachine(`G91 G21  F4000 X-10`);
                                setControllers({...controllers, x: (controllers.x - 10) < 0 ? 0 : controllers.x - 10});
                            }}>
                            <ChevronLeft size={20} strokeWidth={4} color={'#F5762E'}/>
                        </button>
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => sendToMachine('G28')} >
                            <Home size={20} strokeWidth={2} color={'#ffffff'}/>
                        </button>
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => {
                                // sendToMachine(`G00 X${controllers.x} Y${controllers.y}`);
                                sendToMachine(`G91 G21  F4000 X10`);
                                setControllers({...controllers, x: controllers.x + 10});
                            }}>
                            <ChevronRight size={20} strokeWidth={4} color={'#F5762E'}/>
                        </button>
                    </div>
                    <button 
                        className="p-3 bg-[#1C274C] rounded"
                        onClick={ () => {
                            // sendToMachine(`G00 X${controllers.x} Y${controllers.y}`);
                            sendToMachine(`G91 G21  F4000 Y-10`);
                            setControllers({...controllers, y: (controllers.y - 10) < 0 ? 0 : controllers.y - 10});
                        }}>
                        <ChevronDown size={20} strokeWidth={4} color={'#F5762E'}/>
                    </button>
                </div>

                <div className="flex w-full items-end justify-between">
                    { !ws ? (
                        <button className="flex items-center justify-center gap-1 bg-[#0e505c] py-3 px-8 rounded-md" onClick={ handleConnection }>
                            <Plug size={18} strokeWidth={2} color="#FFFFFF"/>
                            <span className="text-[#ffffff] font-['MarryWeatherSans'] text-[16px]"> Ready</span>
                        </button>
                    ) : (
                        <>
                            <button className="flex items-center justify-center gap-1 bg-[#0e505c] py-3 px-8 rounded-md" onClick={ handleConnection }>
                                <Power size={18} strokeWidth={4} color="#FFFFFF" /> 
                                <span className="text-[#ffffff] font-['MarryWeatherSans'] text-[16px]"> Plot</span>
                            </button>
                            <button className="flex items-center justify-center gap-1 bg-[#d41d1d] py-3 px-8 rounded-md" onClick={ closeConnection }>
                                <Power size={18} strokeWidth={4} color="#FFFFFF" /> 
                                <span className="text-[#ffffff] font-['MarryWeatherSans'] text-[16px]"> Disconnect</span>
                            </button>
                        </>
                    )}
                    {/* <p className="flex items-center gap-1">
                        <Dot size={20} strokeWidth={4} className={!ws ? 'text-[#d41d1d]' : 'text-[#2c944f]'} /> 
                        <span className={`text-[12px] ${!ws ? 'text-[#d41d1d]' : 'text-[#2c944f]'}`}>{ ws ? 'Device Connected' : 'No Device Connected'}</span>
                    </p> */}
                </div>

                {/* <div className="flex justify-between w-full">
                    <button className="flex items-center justify-center gap-1 bg-[#027200] py-1 px-5 rounded text-nowrap" onClick={handleJob}>
                        <span className="text-[#FFFFFF] font-['MarryWeatherSans'] text-[12px] tracking-wide"> Start Job</span>
                    </button>
                    <button className="flex items-center justify-center gap-1 bg-[#1C274C] py-1 px-5 rounded">
                        <Pause size={18} strokeWidth={2} fill="#FFFFFF" color="#FFFFFF" /> 
                        <span className="text-[#FFFFFF] font-['MarryWeatherSans'] text-[14px] tracking-wide"> Pause</span>
                    </button>
                    <button className="flex items-center justify-center gap-1 bg-[#BE0A0A] py-1 px-5 rounded-full" >
                        <Power size={18} strokeWidth={4} color="#FFFFFF" /> 
                        <span className="text-[#FFFFFF] font-['MarryWeatherSans'] text-[14px] tracking-wide"> Stop</span>
                    </button>
                </div> */}
            </div>

            { setupModal &&
                <SetupModal 
                    modalOpen={setupModal} 
                    setModalOpen={setSetupModal}
                    setWs={setWs}
                    ws={ws}
                    setResponse={setResponse}
                /> 
            }
        </div>
    )
}

