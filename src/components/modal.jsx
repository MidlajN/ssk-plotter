/* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable react/prop-types */
import ReactModal from "react-modal";
import { Triangle } from "react-loader-spinner";
// import { useEffect } from "react";
import { X } from "lucide-react";
import { useCom } from "../context";
import { useEffect } from "react";
ReactModal.setAppElement('#root');


export const SetupModal = () => {
    const { 
        // ws,
        job,
        openSocket,
        setupModal,
        setSetupModal,
        machineUrl,
        // setJob
    } = useCom();

    useEffect(() => {
        // setJob({ connecting: false, connected: true, started: false })
    }, []);


    return (
        <ReactModal 
            // isOpen={true} 
            isOpen={setupModal} 
            style={{ 
                overlay: { 
                    background: 'transparent'
                }, 
                content: { 
                    width: 'fit-content', 
                    height: 'fit-content', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    padding: '0px',
                    border: 'none',
                    maxWidth: '30rem',
                    borderRadius: 'none',
                    background: 'transparent'

                } 
            }}>
            <div className="setupModal" >
                { job.connected &&
                    <div className="flex justify-end bg-white border-b border-[#1c8096]">
                        <button className="p-2 text-[#1c8096] hover:text-red-600" onClick={() => { setSetupModal(false) }}>
                            <X size={18} strokeWidth={2} />
                        </button>
                    </div>
                }
                
                <div className="bg-white pt-10 pb-10 px-10 w-[20rem] sm:w-full">
                { !job.connected ?
                    <div className="flex items-center gap-6">
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
                            <p className="text-[15px]">URL : <span className=" text-slate-400">ws://{ machineUrl }</span></p>
                        </div>
                    </div> : 
                    <div>
                        <div className="flex justify-between sm:items-start items-baseline">
                            { job.started ? 
                                <div>
                                    <p className="text-nowrap sm:text-[27px] text-[20px] font-semibold text-gray-500 flex items-baseline gap-2">
                                        <span className="text-[#15af7c]">Job Started</span>
                                        <span className="text-[30px] font-extrabold text-[#15a528]">!</span>
                                    </p>
                                    {/* eslint-disable-next-line react/no-unescaped-entities */}
                                    <p className="sm:text-[13px] text-[11px] pr-3">The machine will start to plot in your canvas</p>
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
                            <button 
                                className="transition-all duration-300 bg-[#404e7c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                                onClick={ () => { setSetupModal(false) }}
                            >Cancel</button>
                        </div>
                    </div>
                }
            </div>
        </ReactModal>
    )
}
