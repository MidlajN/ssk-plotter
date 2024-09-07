/* eslint-disable react-hooks/exhaustive-deps */

/* eslint-disable react/prop-types */
import ReactModal from "react-modal";
import { Triangle } from "react-loader-spinner";
// import { useEffect } from "react";
import { X } from "lucide-react";
import { useCom } from "../context";
import { PlotSvg } from "./icons";
ReactModal.setAppElement('#root');

export const SetupModal = () => {
    const { 
        job,
        openSocket,
        setupModal,
        setSetupModal,
        config,
        progress,
    } = useCom();

    const ConnectionModal = () => {
        return (
            <>
                <div className="bg-white pt-10 pb-10 px-10 min-w-[22rem]">
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
                            <p className="text-[15px]">URL : <span className=" text-slate-400">ws://{ config.url }</span></p>
                        </div>
                    </div>
                </div>
                { !job.connected &&
                    <div className="content" >
                        <div className="flex justify-end gap-4 mt-10">
                        { !job.connecting &&
                            <button 
                                className="transition-all duration-300 bg-[#2a365c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                                onClick={openSocket}
                            >Retry</button>
                        }
                            <button 
                                className="transition-all duration-300 bg-[#404e7c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                                onClick={ () => {
                                    setSetupModal(false);
                                }}
                            >Cancel</button>
                        </div>
                    </div>
                }
            </>
        )
    }

    const JobModal = ({ label, text }) => {
        return (
            <div className="sm:pb-2">
                <p className="text-nowrap lg:text-[27px] text-[20px] font-semibold text-gray-500 flex items-baseline gap-2">
                    <span className="text-[#092f61]">{ label }</span> 
                    <span className="text-[30px] font-extrabold text-[#1d60b8]">!</span>
                </p>
                {/* eslint-disable-next-line react/no-unescaped-entities */}
                <p className="lg:text-[13px] text-[11px] pr-3">{ text }</p>
            </div>
        )
    }


    return (
        <ReactModal 
            isOpen={setupModal} 
            style={{ 
                overlay: { 
                    background: 'transparent',
                    zIndex: '999'
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
                    background: 'transparent',
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
                
                { !job.connected ? (
                    <ConnectionModal />
                ): 
                <div className="bg-white pt-10 pb-10 px-10 min-w-[22rem]">
                    <div className="flex justify-between items-end gap-3">
                        { job.started && !progress.converting && !progress.uploading &&
                            <JobModal 
                                label={'Job Has Started'} 
                                text={<>The machine will start to plot your drawings in the <span className="font-semibold">Canvas.</span></>} 
                            />  
                        }

                        { job.connected && !progress.converting && !progress.uploading && !job.started &&
                            <JobModal 
                                label={'Ready To Plot'} 
                                // eslint-disable-next-line react/no-unescaped-entities
                                text={<>Click the <span className="font-semibold">'Plot'</span> Button to draw the pictures in from the canvas.</>} 
                            />  
                        }
  
                        { job.connected && !progress.converting && progress.uploading &&
                            <div className="h-full flex flex-col justify-center my-auto sm:pb-2">
                                <p className="text-nowrap font-medium text-gray-500 flex items-baseline gap-1">
                                    <span className="sm:text-[20px] text-[15px]" style={{ color: '#146a7e' }}>Uploading</span> 
                                    <span className="text-[20px] font-semibold" style={{ color: '#146a7e' }}>!...</span>
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mb-4 mt-1">
                                    <div 
                                        className="h-full transition-all duration-500" 
                                        style={{ width: `${progress.progress}%`, background: '#146a7e' }}
                                    />
                                </div>
                                <p className="sm:text-[13px] text-[11px] pr-3">We are uploading the pictures to machine <span className="font-semibold">Please Wait...</span></p>
                            </div>
                        }
                        { job.connected && progress.converting && !progress.uploading &&
                            <div className="h-full flex flex-col justify-center my-auto sm:pb-2">
                                <p className="text-nowrap font-medium text-gray-500 flex items-baseline gap-1">
                                    <span className="sm:text-[20px] text-[15px]" style={{ color: '#14427e' }}>Converting</span> 
                                    <span className="text-[20px] font-semibold" style={{ color: '#14427e' }}>!...</span>
                                </p>
                                <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mb-4 mt-1">
                                    <div 
                                        className="h-full transition-all duration-500" 
                                        style={{ width: `${progress.progress}%`, background: '#14427e' }}
                                    />
                                </div>
                                <p className="sm:text-[13px] text-[11px] pr-3">We are uploading the pictures to machine <span className="font-semibold">Please Wait...</span></p>
                            </div>
                        }
                        <div className="lg:w-[50%] w-[60%] pt-1">
                            <PlotSvg />
                        </div>
                    </div>
                </div>
                }
            </div>
        </ReactModal>
    )
}
