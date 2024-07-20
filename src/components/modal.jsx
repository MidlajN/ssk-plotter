/* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable react/prop-types */
import ReactModal from "react-modal";
import { Triangle } from "react-loader-spinner";
import { useEffect, useCallback } from "react";
import { Webhook } from "lucide-react";
import { useCom } from "../context";
ReactModal.setAppElement('#root');


export const SetupModal = ({modalOpen, setModalOpen, ws, setWs, setResponse, job, setJob}) => {
    // const { machineUrl, port } = useCanvas();
    const { machineUrl } = useCom();
    
    const openSocket = useCallback(() => {
        if (ws !== null) return;
        try {
            setJob({ connecting: true, connected: false, started: false })
            // const socket = new WebSocket("ws://kochund.local:81", ['arduino']);
            setTimeout(() => {
                // setWs(new WebSocket(`ws://${machineUrl}:${port}`));
                setWs(new WebSocket(`ws://${machineUrl}`));
            }, 3000)

        } catch (err) {
            setWs(null);
        }
    }, [])

    useEffect(() => {
        if (!ws) return;
        ws.onopen = () => {
            
            // For Test
            const sendPing = () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('Ping');
                    setTimeout(sendPing, 5000);
                }
            };
            sendPing();

            setJob({ connecting: false, connected: true, started: false })

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
                    setResponse(prev => ({ ...prev, message: prev.message + text + "\n" }));
                };
                reader.readAsText(event.data);
            } else if (event.data instanceof ArrayBuffer) {
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
            if (job.started) setJob({ connected: false, connecting: false, started: false });
            setResponse(prev => ({ ...prev, message: prev.message +`Socket Connection Closed ... \nSocket URL : ws://localhost:5000 \n` }));
            if (job.connected) setModalOpen(false);
        }

        ws.onerror = (err) => {
            console.log('Socket error -> ', err);
            setJob({ connected: false, connecting: false, started: false })
        }

        return () => {
            // console.log('Socket Check : ', job)
        }
    }, [job, ws])


    useEffect(() => {
        if (ws || job.connected) {
            setTimeout(() => {
                setModalOpen(false);
            }, 3000)
            return
        } else {
            console.log('Function execution from useEffect ->')
            openSocket();
        }
        
        // return () =>{
        //     console.log('Socket : ', job)
        // }
    }, [setModalOpen]);

    

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
                { !job.connected ?
                    <div className="flex items-center gap-6 p-5">
                        <Triangle visible={true} width={40} height={40} color={ job.connecting ? '#1c7f969c' : '#831414'} ariaLabel="infinity-spin-loading" />
                        <div className="config">
                            { job.connecting ? 
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
                            { job.started ? 
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
                { !job.connecting && !job.connected && 
                <div className="content" >
                    <div className="flex justify-end gap-4 mt-10">
                        <button 
                            className="transition-all duration-300 bg-[#2a365c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                            onClick={openSocket}
                        >Retry</button>
                    </div>
                </div>
                }
            </div>
        </ReactModal>
    )
}
