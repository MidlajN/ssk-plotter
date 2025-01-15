/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import ReactModal from "react-modal";
import { Triangle } from "react-loader-spinner";
// import { X } from "lucide-react";
import useCom from "../../context/ComContext";
import { PlotSvg } from "../Icons";
import { motion } from "framer-motion";
import { PrinterIcon } from "lucide-react";

ReactModal.setAppElement('#root');

export const SetupModal = () => {
    const { 
        job,
        openSocket,
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
                <p className="text-nowrap lg:text-[24px] text-[17px] font-semibold text-gray-500 flex items-baseline gap-2">
                    <span className="text-[#092f61]">{ label }</span> 
                    <span className="text-[28px] font-extrabold text-[#1d60b8]">!</span>
                </p>
                {/* eslint-disable-next-line react/no-unescaped-entities */}
                <p className="lg:text-[13px] text-[11px] pr-3">{ text }</p>
            </div>
        )
    }


    return (
        <>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="absolute w-fit bg-white rounded-xl overflow-hidden shadow-lg border border-[#cfcfcf7c]"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.4,
                        scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 }
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                >
                    <div className="setupModal">
                        { !job.connected ? (
                            <ConnectionModal />
                        ):
                        <>
                            <div className="bg-white pt-6 pb-6 pl-6 pr-9 w-[33rem]">
                                <div className="flex justify-between items-center gap-5">
                                    <div className="flex p-5 border rounded-lg  w-[6rem] h-[6rem]">
                                        <PlotSvg />
                                    </div>
                                    { job.started && !progress.converting && !progress.uploading &&
                                        <JobModal 
                                            label={'Job Has Started'} 
                                            text={<>The machine will start to plot your drawings in the <span className="font-semibold">Canvas.</span></>} 
                                        />  
                                    }

                                    { job.connected && !progress.converting && !progress.uploading && !job.started &&
                                        <JobModal 
                                            label={'Ready To Plot'} 
                                            text={<>Click the <span className="font-semibold">&apos;Plot&apos;</span> Button to draw the pictures in from the canvas.</>} 
                                        />  
                                    }
            
                                    { job.connected && !progress.converting && progress.uploading &&
                                        <div className="h-full flex flex-col justify-center my-auto sm:pb-2">
                                            <p className="text-nowrap font-medium text-gray-500 flex items-baseline gap-1">
                                                <span className="sm:text-[20px] text-[15px]" style={{ color: '#146a7e' }}>Uploading</span> 
                                                <span className="text-[20px] font-semibold" style={{ color: '#146a7e' }}>!...</span>
                                            </p>
                                            <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden mb-3 mt-1">
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
                                </div>
                            </div>
                        </>
                        }
                    </div>
                </motion.div>
            </motion.div>
        </>
    )
}

export const ShowPrompt = ({ plot, setShow }) => {

    return (
        <>
            <motion.div
                className="fixed inset-0 z-50 flex items-center justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                <motion.div
                    className="absolute w-fit bg-white rounded-xl overflow-hidden shadow-lg border border-[#cfcfcf7c]"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                        duration: 0.4,
                        scale: { type: 'spring', visualDuration: 0.4, bounce: 0.5 }
                    }}
                    exit={{ scale: 0, opacity: 0 }}
                >
                    <div className="flex flex-col gap-4 pt-6 pb-4 ps-6 pr-5">
                        <div className="flex gap-5 justify-center items-center">
                            <div className="p-5 border w-fit h-fit rounded-full">
                                <PrinterIcon />
                            </div>
                            <p className=" max-w-[25rem]">
                                <span className="text-lg font-medium ">Plotting is about to start!</span><br />
                                <span className=" text-gray-600">Please confirm that the paper is loaded correctly and press Proceed to start</span>
                            </p>
                        </div>
                        <div className="ml-auto">
                            <button 
                                className="
                                    me-2 bg-gray-200 border border-gray-200 py-1 px-4 font-medium rounded-md hover:border-gray-300
                                    transition-all duration-300 focus:bg-gray-300
                                "
                                onClick={ () => setShow(false) }
                            >
                            Cancel</button>
                            <button 
                                className="
                                    py-1 px-4 font-medium border bg-green-200 border-green-200 text-green-950 rounded-md
                                    hover:border-green-400 transition-all duration-300 focus:bg-green-300
                                "
                                onClick={ plot }
                            >
                            Proceed</button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </>
    )
}