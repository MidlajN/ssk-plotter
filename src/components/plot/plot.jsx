/* eslint-disable react/prop-types */
import { useEffect, useRef } from "react";
import { 
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Home,
    Power,
    FileCog,
    Plug,
    Pencil
} from "lucide-react";
import useCanvas, { useCom } from "../../context";
import './cut.css';
import { SetupModal } from "../modal";
import tinycolor from "tinycolor2";
import { Converter } from "svg-to-gcode";


export const Plot = () => {
    const { canvas } = useCanvas();
    const {
        response,
        ws, 
        setWs,
        // job,
        setJob,
        machineUrl,
        setupModal, 
        setSetupModal,
        openSocket,
        // progress, 
        setProgress
    } = useCom();
    const textareaRef = useRef(null)
    const gcodeRef = useRef(null)

    const handleConnection = async () => {
        openSocket();
        setSetupModal(true)
    }

    const closeConnection = () => {
        ws.close();
        setWs(null);
    }

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const plot =  async () => {
        // if (job.started) return;
        setProgress({ uploading: false, converting: true, progress: 10 });
        setJob({ connecting: false, connected: true, started:  false});
        setSetupModal(true);
        await delay(500);

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

        setProgress({ uploading: false, converting: true, progress: 40 });
        await delay(500);

        const converter = new Converter();
        const gcodes = await Promise.all(svgElements.map( async (element) => {
            const [ code ] = await converter.convert(element.svg);
            const gCodeLines = code.split('\n');
            const cleanedGcodeLines = gCodeLines.slice(0, -5);
            return [ colorCommand[element.color] + cleanedGcodeLines.join('\n')];
        }));

        setProgress({ uploading: false, converting: true, progress: 80 });
        await delay(500);

        // Send to Machine
        const blob = new Blob([gcodes.join('\n')], { type: 'text/plain' });
        const file = new File([blob], 'job.gcode', { type: 'text/plain' });

        const formData = new FormData();
        formData.append('file', file);
        
        try {

            setProgress({ uploading: true, converting: false, progress: 80  });
            await delay(500);

            const http = new XMLHttpRequest();
            // http.upload.onprogress = (event) => {
            //     // console.log('EVET : ', event)
            //     if (event.lengthComputable) {
            //         const precentCompleted = ( event.loaded / event.total ) * 100;
            //         // console.log('Uploaded', precentCompleted);
            //     }
            // }
            http.onreadystatechange = async () => {
                if (http.readyState === 4) {
                    if (http.status === 200) {
                        sendToMachine(`[ESP220]/${file.name}`)
                        setJob({ connecting: false, connected: true, started:  true});
                        setProgress({ uploading: true, converting: false, progress: 100  })
                        await delay(500);
                        setProgress({ uploading: false, converting: false, progress: 100  })
                        
                        setTimeout(() => {
                            setSetupModal(false)
                        }, 2000);
                    }
                }
            }
            http.open("POST", `http://${ machineUrl }/upload`, true);
            http.send(formData);
        } catch (err) {
            console.log('Error While Uploading -> ', err);
        }
    }



    const sendToMachine = async (gcode) => {
        try {
            console.log(
                'Function FOR SEND : ', gcode
            )
            const http = new XMLHttpRequest();
            http.onreadystatechange = () => {
                if (http.readyState === 4) {
                    console.log(http);
                    if (http.status === 200) {
                        console.log(http.responseText);
                    }
                }
            }
            http.open("GET", `http://${ machineUrl }/command?commandText=` + encodeURI(gcode), true);
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
                    <textarea ref={textareaRef} value={ response.message } className="pointer-events-none" readOnly></textarea>
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
                            sendToMachine(`G91 G21  F4000 Y10`);
                        }}
                        >
                        <ChevronUp size={20} strokeWidth={4} color={'#F5762E'}/>
                    </button>
                    <div className="flex gap-3">
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => {
                                sendToMachine(`G91 G21  F4000 X-10`);
                            }}>
                            <ChevronLeft size={20} strokeWidth={4} color={'#F5762E'}/>
                        </button>
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => sendToMachine('$H')} >
                            <Home size={20} strokeWidth={2} color={'#ffffff'}/>
                        </button>
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => {
                                sendToMachine(`G91 G21  F4000 X10`);
                            }}>
                            <ChevronRight size={20} strokeWidth={4} color={'#F5762E'}/>
                        </button>
                    </div>
                    <button 
                        className="p-3 bg-[#1C274C] rounded"
                        onClick={ () => {
                            sendToMachine(`G91 G21  F4000 Y-10`);
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
                            <button className="flex items-center justify-center gap-1 bg-[#0e505c] py-3 px-8 rounded-md" onClick={ plot }>
                                <Pencil size={18} strokeWidth={2} color="#FFFFFF" /> 
                                <span className="text-[#ffffff] font-['MarryWeatherSans'] text-[16px]">Plot</span>
                            </button>
                            <button className="flex items-center justify-center gap-1 bg-[#d41d1d] py-3 px-8 rounded-md" onClick={ closeConnection }>
                                <Power size={18} strokeWidth={4} color="#FFFFFF" /> 
                                <span className="text-[#ffffff] font-['MarryWeatherSans'] text-[16px]"> Disconnect</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            { setupModal && <SetupModal /> }
            <SetupModal />
        </div>
    )
}

