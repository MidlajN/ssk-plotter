/* eslint-disable react/prop-types */
import ReactModal from "react-modal";
import { Triangle } from "react-loader-spinner";
import { useEffect, useState, useCallback } from "react";
import { Webhook } from "lucide-react";
import useCanvas from "../context";
import tinycolor from "tinycolor2";
import { Converter } from "svg-to-gcode";
ReactModal.setAppElement('#root');


export const SetupModal = ({modalOpen, setModalOpen, ws, setWs, setResponse}) => {
    const [ socket, setSocket ] = useState({ connecting: false, connected: false })
    const [ jobStarted, setJobStarted ] = useState(false);
    const { canvas } = useCanvas();
    
    const openSocket = useCallback(() => {
        if (ws !== null) return;
        try {
            setSocket({ connecting: true, connected: false })
            // const socket = new WebSocket("ws://kochund.local:81", ['arduino']);
            setTimeout(() => {
                // setWs(new WebSocket('ws://192.168.0.1:81'));
                setWs(new WebSocket('ws://localhost:5000'));
            }, 3000)

        } catch (err) {
            setWs(null);
            console.log("Error while connecting", err)
        }
    }, [setWs, ws])

    useEffect(() => {
        if (!ws) return;
        console.log('Socket IS REady : ', socket)
        ws.onopen = () => {
            console.log('Socket opened ->')
            
            // For Test
            const sendPing = () => {
                if (ws.readyState === WebSocket.OPEN) {
                    // console.log('Socket Still Running ->', socket)
                    ws.send('Ping');
                    setTimeout(sendPing, 5000);
                }
            };
            sendPing();

            setSocket({ connecting: false, connected: true })

            setTimeout(() => {
                setModalOpen(false);
            }, 3000);
        }
        
        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                console.log('Blob ', event.data)
                const reader = new FileReader();
                reader.onload = function() {
                    const text = reader.result;
                    console.log('Blob as Text: ', text);
                    // You can also update your response state here
                    setResponse(prev => ({ ...prev, message: prev.message + text + "\n" }));
                };
                reader.readAsText(event.data);
            }
            if (event.data instanceof ArrayBuffer) {
                const arrayBuffer = event.data;
                const text = `Response  ->  ${ new TextDecoder().decode(arrayBuffer) }\n`;
                setResponse(prev => ({ ...prev, message: prev.message + text }));

            } else {
                console.log('Response :', event)
                setResponse(prev => ({ ...prev, message: prev.message + event.data + "\n" }));
            }
        }

        ws.onclose = () => {
            setWs(null);
            if (jobStarted) setJobStarted(false);
            setResponse(prev => ({ ...prev, message: prev.message +`Socket Connection Closed ... \nSocket URL : ws://localhost:5000 \n` }));
            if (socket.connected) setModalOpen(false);
        }

        ws.onerror = (err) => {
            console.log('Socket error -> ', err);
            setSocket({ connected: false, connecting: false })
        }

        return () => {
            console.log('Socket Check : ', socket)
        }
    }, [setResponse, setWs, socket, ws])


    useEffect(() => {
        if (ws) return;

        openSocket();

        return () =>{
            console.log('Socket : ', socket)
        }
    }, []);

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


    return (
        <ReactModal 
            isOpen={modalOpen} 
            style={{ 
                overlay: { 
                    width: 'fit-content',
                    height: 'fit-content', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                }, 
                content: { 
                    width: 'fit-content', 
                    height: 'fit-content', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    padding: '0px',
                    border: 'none',
                    // width: '50rem',
                    // minWidth: '30rem',
                    borderRadius: 'none',
                    background: 'transparent'
                } 
            }}>
            <div className="setupModal" >
                
                <div className="bg-white py-3 px-6">
                { !socket.connected ?
                    <div className="flex items-center gap-6 p-5">
                        <Triangle visible={true} width={40} height={40} color={ socket.connecting ? '#1c7f969c' : '#831414'} ariaLabel="infinity-spin-loading" />
                        <div className="config">
                            { socket.connecting ? 
                                <p className="sm:text-[25px] text-[20px]">
                                    Connecting <span className="dots"></span>
                                </p> : 
                                <p className="sm:text-[25px] text-[20px] text-[#831414]">
                                    Couldn&apos;t Connect
                                </p>
                            }
                            <p className="text-[15px]">URL : <span className=" text-slate-400">ws://kochund.local:86</span></p>
                        </div>
                    </div> : 
                    <div className="p-5 overflow-hidden">
                        <div className="flex items-center gap-6">
                            <Webhook width={40} height={40} color="#14831a" ariaLabel="infinity-spin-loading" strokeWidth={1} />
                            <div className="config">
                                    <p className="sm:text-[25px] text-[20px] text-[#14831a]">
                                        Connection Established
                                    </p>
                                <p className="sm:text-[15px] mt-1 text-[12px]">URL : <span className=" text-slate-400">ws://kochund.local:86</span></p>
                            </div>
                        </div> 
                        <div className="flex justify-between sm:items-start items-baseline sm:pt-12 pt-5">
                            { jobStarted ? 
                                <div>
                                    <p className="text-nowrap sm:text-[27px] text-[20px] font-semibold text-gray-500 flex items-baseline gap-2">
                                        <span className="text-[#15af7c]">Job Started</span>
                                        <span className="text-[30px] font-extrabold text-[#15a528]">!</span>
                                    </p>
                                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                                    <p className="sm:text-[13px] text-[11px] pr-3">Click the <span className="font-semibold">'Refresh'</span> Button to re-plot or plot from the beginning.</p>
                                </div> :
                                <div>
                                    <p className="text-nowrap sm:text-[27px] text-[20px] font-semibold text-gray-500 flex items-baseline gap-2">
                                        <span>Ready To</span> 
                                        <span className="text-[#092f61]">Plot</span> 
                                        <span className="text-[30px] font-extrabold text-[#092f61]">!</span>
                                    </p>
                                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                                    <p className="sm:text-[13px] text-[11px] pr-3">Click the <span className="font-semibold">'Plot'</span> Button to draw the pictures in from the canvas.</p>
                                </div>
                            }
                            <img className="object-contain w-[45%] mt-auto" src="/plot.svg" alt="" />
                        </div>
                    </div>
                }
                </div>
                { !socket.connecting && !socket.connected && 
                <div className="content" >
                    <div className="flex justify-end gap-4 mt-10">
                        
                            <button 
                                className="transition-all duration-300 bg-[#2a365c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                                onClick={openSocket}
                            >Retry</button>
                        

                        {/* { !socket.connecting && !socket.connected && 
                            <button 
                                className="transition-all duration-300 bg-[#2a365c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                                onClick={openSocket}
                            >Retry</button>
                        }
                        { !socket.connected && !jobStarted && 
                            <button 
                                className="transition-all duration-300 bg-[#2a365c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                                onClick={plot}
                            >Plot</button>
                        }
                        { socket.connected && jobStarted && 
                            <button 
                                className="transition-all duration-300 bg-[#2a365c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                                onClick={ () => {
                                    setJobStarted(false);
                                }}
                            >Refresh</button>
                        }
                        <button 
                            className="transition-all duration-300 bg-[#23325cbb] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                            onClick={ () => { 
                                ws.close();
                                setWs(null);
                                setModalOpen(false) ;
                            }}
                        > Cancel
                        </button> */}
                    </div>
                </div>
                }
            </div>
        </ReactModal>
    )
}
