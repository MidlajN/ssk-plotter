/* eslint-disable react/prop-types */
import ReactModal from "react-modal";
import { Triangle } from "react-loader-spinner";
import { useEffect, useState, useCallback } from "react";
import { Webhook } from "lucide-react";
ReactModal.setAppElement('#root');


export const SetupModal = ({modalOpen, setModalOpen, ws, setWs}) => {
    const [ socket, setSocket ] = useState({ connecting: false, connected: false })
    
    const openSocket = useCallback(() => {
        if (ws) return;
        try {
            setSocket({ connecting: true, connected: false })
            const socket = new WebSocket("ws://kochund.local:81", ['arduino']);
            socket.binaryType = 'arraybuffer';

            socket.onerror = (error) => {
                setSocket({ connecting: false, connected: false })
            }

            socket.onopen = () => {
                setWs(socket);
                setSocket({ connecting: false, connected: true })
            }

        } catch (err) {
            setWs(null);
            console.log("Error while connecting", err)
        }
    }, [setWs, ws])

    useEffect(() => {
        openSocket();
    }, [])


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
                                    Couldn't Connect
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
                            <div>
                                <p className="text-nowrap sm:text-[27px] text-[20px] font-semibold text-gray-500 flex items-baseline gap-2">
                                    <span>Ready To</span> 
                                    <span className="text-[#092f61]">Plot</span> 
                                    <span className="text-[30px] font-extrabold text-[#092f61]">!</span>
                                </p>
                                <p className="sm:text-[13px] text-[11px] pr-3">Click the <span className="font-semibold">'Plot'</span> Button to draw the pictures in from the canvas.</p>
                            </div>
                            <img className="object-contain w-[45%] mt-auto" src="/plot.svg" alt="" />
                        </div>
                    </div>
                }
                </div>
                
                <div className="content" >
                    <div className="flex justify-end gap-4 mt-10">
                        { !socket.connecting && 
                            <button 
                                className="transition-all duration-300 bg-[#2a365c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                                onClick={openSocket}
                            >Retry</button>
                        }
                        { socket.connected && 
                            <button 
                                className="transition-all duration-300 bg-[#2a365c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                            >Plot</button>
                        }

                        <button 
                            className="transition-all duration-300 bg-[#23325cbb] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                            onClick={ () => { setModalOpen(false) } }
                        > Cancel
                        </button>
                    </div>
                </div>
            </div>
        </ReactModal>
    )
}
