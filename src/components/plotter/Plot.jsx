/* eslint-disable react/prop-types */
import { useEffect, useRef, useCallback, useState } from "react";
import { 
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Home,
    Power,
    Plug,
    Pencil,
    GripHorizontal,
    X,
    OctagonX,
    // Pause,
    Play,
    Info,
    CheckCheck,
    Settings,
    ArrowUp
} from "lucide-react";
import useCanvas from "../../context/CanvasContext";
import useCom from "../../context/ComContext";
import { SetupModal } from "./Modal";
import { returnGroupedObjects, returnSvgElements, sortSvgElements, convertToGcode } from "../../util/convert";
import { motion } from "framer-motion";
import './plotter.css'
import { RotateLeft, RotateRight } from "./Icons";
import { Group } from "fabric";
import { AnimatePresence } from "framer-motion";

export const Plot = ({ plotCanvas }) => {
    const { canvas } = useCanvas();
    const {
        response, config, setConfig, setupModal, job, setJob, colors,
        setSetupModal, setProgress,  openSocket, closeSocket, sendToMachine
    } = useCom();
    const [ openConfig, setOpenConfig ] = useState(false)
    const textareaRef = useRef(null)
    const gcodeRef = useRef(null)

    const uploadToMachine = async (gcode) => {
        const blob = new Blob([gcode.join('\n')], { type: 'text/plain '});
        const file = new File([blob], 'job.gcode', { type: 'text/plain' });
        const formData = new FormData();
        formData.append('file', file);

        try {
            setProgress({ uploading: true, converting: false, progress: 80  });
            await delay(500);

            const response =  await fetch(`http://${ config.url }/upload`, {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            console.log('Request Send Successfully :', data);

            sendToMachine(`[ESP220]/${file.name}`);
            setProgress({ uploading: true, converting: false, progress: 100  });
            await delay(500);
            setProgress({ uploading: false, converting: false, progress: 100  });
            setJob({ ...job, started:  true});

            setTimeout(() => { setSetupModal(false) }, 3000);
        } catch  (err) {
            console.log('Error While Uploading : ', err);
            setProgress({ uploading: false, converting: false, progress: 0 });
            setTimeout(() => { setSetupModal(false) }, 3000);
        }
    }

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const plot =  async () => {
        setProgress({ uploading: false, converting: true, progress: 10 });
        setJob({ ...job, connected: true });
        setSetupModal(true);
        await delay(500);

        const groupedObjects = returnGroupedObjects(canvas)

        const svgElements = returnSvgElements(groupedObjects, canvas.getWidth(), canvas.getHeight());
        sortSvgElements(svgElements, colors);

        setProgress({ uploading: false, converting: true, progress: 40 });
        await delay(500);

        const gcodes = await convertToGcode(svgElements, colors, config);
        console.log('Gcode Generated : \n', gcodes.join('\n'))

        setProgress({ uploading: false, converting: true, progress: 80 });
        await delay(500);

        uploadToMachine(gcodes);
    };

    useEffect(() => {
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.getObjects().forEach((obj) => obj.set({ selectable: false }));
        canvas.requestRenderAll();

        return () => {
            canvas.selection = true;
            canvas.getObjects().forEach(obj => {
                if (obj.name !== 'ToolHead' && obj.name !== 'BedSize') {
                    obj.set({ selectable: true })
                }
            });
        };
    }, [canvas]);

    // Scroll the textarea to the bottom when it overflows
    // useEffect(() => {
    //     if ( textareaRef.current ) {
    //         textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    //     }
    // }, [response.message]);

    const JogButton = ({gcode, Icon, className}) => {
        return (
            <motion.button
                className={`${className} p-3 bg-[#1C274C] rounded flex justify-center items-center`}
                onClick={ () => sendToMachine(gcode) }
                whileTap={{ scale: 0.95 }}
            >
                <Icon size={20} strokeWidth={gcode === '$H' ? 2 : 4} color={gcode === '$H' ? '#ffffff' : '#F5762E'} />
            </motion.button>
        )
    }

    const handleRotation = (angle) => {
        const activeObjects = plotCanvas.getActiveObjects()
        const group = new Group(activeObjects)
        plotCanvas.remove(...activeObjects)
        group.rotate(angle)
        plotCanvas.add(...group.removeAll());
        plotCanvas.renderAll();
    }

    const ActionButton = ({ label, Icon, onclick, bgColor }) => {
        return (

            <motion.button
                style={{ background: bgColor }}
                className="flex items-center justify-center gap-1 py-3 px-8 rounded-md"
                onClick={ onclick }
                whileTap={{ scale: 0.95,  }}
            >
                <Icon size={18} strokeWidth={2} color="#FFFFFF"/>
                <span className="text-[#ffffff] font-medium text-[16px]"> { label } </span>
            </motion.button>
        )
    }

    return (
        <>
        <div className="flex justify-between gap-4 max-[750px]:flex-col lg:flex-col p-5 z-[2] relative bg-white h-full pb-10">
            <div className="cut w-full">
                {/* <div 
                    className="w-full flex items-end lg:justify-end gap-3 pb-4" 
                    onClick={ () => { setConfig({ ...config, open: !config.open })}}
                >
                    <div className="flex gap-2 items-center bg-[#1287a1] p-1 rounded-full cursor-pointer">
                        <div className="bg-[#adc1ff83] rounded-full p-1">
                            { config.open ? (
                                <ChevronRight size={11} strokeWidth={4} color={'#ffffff'} />
                            ): (
                                <ChevronLeft size={11} strokeWidth={4} color={'#ffffff'} />
                            )}
                        </div>
                        <p className="text-[12px] pr-2 text-white font-medium">Settings</p>
                    </div>
                </div> */}

                <div className="p-5">
                    <div className="flex gap-6 pb-2">
                        <p className="min-w-14">Width</p>
                        <p>445 <span className="text-xs text-gray-500">mm</span></p>
                    </div>
                    <div className="flex gap-6 pb-2">
                        <p className="min-w-14">Height</p>
                        <p>435 <span className="text-xs text-gray-500">mm</span></p>
                    </div>
                    <div className="flex gap-6">
                        <p className="min-w-14">Angle</p>
                        <p>0 <span className="text-xs text-gray-500">deg</span></p>
                    </div>
                </div>

                <div className="mx-3 px-1 py-1 flex bg-gray-100 rounded-xl items-center">
                    <div 
                        className="hover:bg-gray-200 active:bg-gray-300 p-2 rounded-xl cursor-pointer transition-all duration-300"
                        onClick={() => handleRotation(90)}
                    >
                        <RotateRight width={25} height={25} />
                    </div>
                    <div 
                        className="hover:bg-gray-200 active:bg-gray-300 p-2 rounded-xl cursor-pointer transition-all duration-300"
                        onClick={() => handleRotation(-90)}
                    >
                        <RotateLeft width={25} height={25} />
                    </div>
                    <div 
                        className="hover:bg-gray-200 active:bg-gray-300 p-2 rounded-xl cursor-pointer transition-all duration-300 ml-auto" 
                        onClick={ () => setOpenConfig(true) }
                    >
                        <Settings size={22} strokeWidth={1.5} />
                    </div>
                </div>
                <ConfigModal openConfig={openConfig} setOpenConfig={setOpenConfig} />

                {/* <div className="px-3 py-4 border-b border-white bg-[#2a334e] flex items-center gap-2">
                    <Info size={14} strokeWidth={2} color={'#ffff'} />
                    { !job.started && !job.percentage ? (
                        <p className="text-sm text-white">Currently No Job Is Running...</p>
                    ) : (
                        <>
                            <div className="w-1/2 bg-gray-200 rounded-full h-1 overflow-hidden">
                                <div 
                                    className="h-full transition-all duration-500 animate-gradientMove" 
                                    style={{ 
                                        width: `${job.percentage}%`, 
                                        background: `${job.percentage === 100 ? '#146a7e' : 'linear-gradient(10deg, #F5762E 40%, #ff925dd1 50%, #F5762E 57%)'}`,
                                        backgroundSize: '200% 100%'
                                    }}
                                />
                            </div>
                            <p className="text-sm font-medium text-[#c5c5c5]">{job.percentage}%</p>
                            { job.percentage === 100 && <CheckCheck size={17} strokeWidth={2.5} color={'#ffffff'} /> }
                        </>  
                    )}
                </div> */}

            </div>
            <div className="flex flex-col items-center justify-center gap-5 px-6 lg:px-1 min-w-fit">

                <div className="flex w-full min-w-80 items-end justify-between gap-1 pt-2 lg:pt-12">
                    { !job.connected ? (
                        <ActionButton label={'Ready'} Icon={Plug} onclick={ openSocket } bgColor={'#0e505c'}/>
                    ) : (
                        <>
                            { job.started ? (
                                <>
                                    <button 
                                        className={`flex items-center justify-center gap-1 py-3 px-8 rounded-md`} 
                                        style={{ background: '#113b7a' }} 
                                        onClick={() => {
                                            sendToMachine(job.paused ? '~' : '!');
                                            setJob({ ...job, paused: !job.paused });
                                        }}>
                                        <Play size={18} strokeWidth={2} color="#FFFFFF"/>
                                        <span className="text-[#ffffff] font-medium text-[16px]"> {  job.paused ? 'Resume' : 'Pause' } </span>
                                    </button>
                                    <button 
                                        className={`flex items-center justify-center gap-1 py-3 px-8 rounded-md`} 
                                        style={{ background: '#d41d1d' }} 
                                        onClick={() => {
                                            console.log('Clicked', job.paused)
                                            sendToMachine('$Report/interval=50');
                                            setJob({ ...job, paused: !job.paused });
                                        }}>
                                        <OctagonX size={18} strokeWidth={2} color="#FFFFFF"/>
                                        <span className="text-[#ffffff] font-medium text-[16px]"> Stop </span>
                                    </button>
                                </>
                            ): (
                                <>
                                    <ActionButton label='Plot' Icon={Pencil} bgColor='#0e505c' onclick={plot}/>
                                    <ActionButton label='Disconnect' Icon={Power} bgColor='#d41d1d' onclick={closeSocket}/>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            { setupModal && <SetupModal /> }

        </div>
        <div 
            className={`
                absolute lg:z-0 z-10 lg:w-fit max-w-[24rem] h-full bg-white p-5 flex flex-col top-0 transition-all 
                duration-500 ${ config.open ? 'lg:right-96 right-0' : ' -right-96' } 
            `}
        >
            <ConfigComponent />
        </div>
        </>
    )
}



function ConfigComponent() {
    const { colors, setColors, config, setConfig } = useCom();
    const dragDiv = useRef(0);
    const dragOverDiv = useRef(0)

    const handleSort = () => {
        const cloneColors = [...colors];
        const temp = cloneColors[dragDiv.current]
        cloneColors[dragDiv.current] = cloneColors[dragOverDiv.current];
        cloneColors[dragOverDiv.current] = temp
        setColors(cloneColors)
    }

    const InputComponent = useCallback(({ inputKey, config, setConfig, label, limit=null }) => {
        const handleChange = (e) => {
            let value = e.target.value;
            if (limit) {
                value = parseInt(value < limit ? value : limit)
                value = isNaN(value) ? 0 : value
            }
            setConfig({ ...config, [inputKey]: value })
        }
        return (
            <div className="flex items-center justify-between relative py-1">
                <div className="flex gap-3 items-center justify-between rounded-[7px] p-1 bg-white z-10 w-full">
                    <p className="text-[#575757] text-sm font-normal">{label}</p>
                    <input 
                        type="text" 
                        className="text-end pr-2 transition-all duration-500 outline-none border-b focus:border-[#1c7f969c] text-sm font-normal" 
                        value={config[inputKey]} 
                        onChange={ handleChange }
                    />
                </div>
            </div>
        )
    }, [])

    return (
        <>
            <div className="flex justify-between p-[2px] border-b border-b-[#1c809680] border">
                <p className="font-medium text-[#0c4350] pl-1">Machine Configuration</p>
                <button 
                    onClick={ () => { setConfig({ ...config, open: false })}}
                    className="px-1 bg-red-500">
                    <X size={17} strokeWidth={2} color={'white'} />
                </button>
            </div>
            <div className="py-5">
                <InputComponent inputKey={`url`} config={config} setConfig={setConfig} label={'Machine URL'}/>
                <InputComponent inputKey={`feedRate`} config={config} setConfig={setConfig} label={'Feed Rate'} limit={12000}/>
                <InputComponent inputKey={`jogSpeed`} config={config} setConfig={setConfig} label={'Jog Speed'} limit={15000}/>
            </div>

            <div className="flex flex-col gap-2 p-4 rounded bg-[#f7f7f7]">
                <p className="font-medium text-lg text-[#0a3f4b] mb-3">Pen Colors</p>
                { colors.map((color, index) => (
                    <div 
                        key={index} 
                        className="flex gap-4 justify-between items-center py-1 border-b-2 bg-white px-1 rounded-md" 
                        draggable
                        onDragStart={ () =>  ( dragDiv.current = index )}
                        onDragEnter={ () => { dragOverDiv.current = index }}
                        onDragEnd={ handleSort }
                        onDragOver={ (e) => { e.preventDefault() }}
                    >
                        <div className="flex gap-1 items-center pr-4 pl-[2px]">
                            <GripHorizontal size={17} strokeWidth={2} color="gray" />
                            <div className="border w-9 h-6 rounded bg-slate-500" style={{ backgroundColor: `${color.color}`}}></div>
                            <p className=" font-normal text-[#035264] text-sm pl-2">{color.name}</p>
                        </div>
                        <div className="flex items-center gap-2 bg-[#f0f0f0] py-1 px-1 rounded-md">
                            <p className="pl-2 text-[#0a3f4b] text-[12px]">Z-Value :</p>
                            <input 
                                className="text-center text-sm  pr-1 max-w-14 rounded outline-none" 
                                type="text"
                                value={color.zValue} 
                                onChange={(e) => {
                                    let value = e.target.value
                                    setColors(prevColor => 
                                        prevColor.map((clr, idx) => idx === index ? {...clr, zValue: value } : clr )
                                    );
                                }}
                                onBlur={() => {
                                    // Convert to float when the input loses focus
                                    let value = parseFloat(color.zValue);
                                    if (isNaN(value)) value = 0;
                                    value = value > 20 ? 20 : value;

                                    // Update the state with the parsed float value
                                    setColors(prevColors =>
                                        prevColors.map((clr, idx) => idx === index ? { ...clr, zValue: value } : clr )
                                    );
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>
            <p className="text-[12px] `max-w-80 mt-2 px-2 text-[#525252]">You can rearrange the colors in the order you prefer, and the plotter will draw them in the sequence you&apos;ve specified.</p>
        </>
    )
}


const ConfigModal = ({ openConfig, setOpenConfig }) => {
    const { config, setConfig, sendToMachine, response } = useCom();
    const gcodeRef = useRef(null)
    const textareaRef = useRef(null)

    const InputComponent = useCallback(({ inputKey, config, setConfig, label, limit=null }) => {
        const handleChange = (e) => {
            let value = e.target.value;
            if (limit) {
                value = parseInt(value < limit ? value : limit)
                value = isNaN(value) ? 0 : value
            }
            setConfig({ ...config, [inputKey]: value })
        }
        return (
            <div className="flex items-center justify-between relative py-1">
                <div className="flex gap-5 items-center justify-between rounded-[7px] p-1 bg-white z-10 w-full">
                    <p className="text-[#575757] text-sm font-normal">{label}</p>
                    <input 
                        type="text" 
                        className="text-end pr-2 max-w-[11rem] transition-all duration-500 outline-none border-b focus:border-[#1c7f969c] text-sm font-normal" 
                        value={config[inputKey]} 
                        onChange={ handleChange }
                    />
                </div>
            </div>
        )
    }, [])

    const JogButton = ({gcode, Icon, className}) => {
        return (
            <motion.button
                className={`${className} p-3 bg-[#1C274C] rounded flex justify-center items-center`}
                onClick={ () => sendToMachine(gcode) }
                whileTap={{ scale: 0.95 }}
            >
                <Icon size={20} strokeWidth={gcode === '$H' ? 2 : 4} color={gcode === '$H' ? '#ffffff' : '#F5762E'} />
            </motion.button>
        )
    }

    const sendGcode = () => {
        const value = gcodeRef.current.value;
        sendToMachine(value)
        gcodeRef.current.value = '';
    }

    useEffect(() => {
        if ( textareaRef.current ) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [response.message]);

    return (
        <>
            <AnimatePresence>
                { openConfig &&
                    <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-opacity-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <motion.div
                            className="absolute right-[18%] w-fit bg-white rounded-xl overflow-hidden shadow-lg border border-[#cfcfcf7c]"
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            onClick={(e) => e.stopPropagation()} // Prevent closing on popup click
                        >
                            <div className="flex justify-between items-center "> 
                                <p className="pl-6 pt-3 font-medium text-[#1e263f]">Control Settings</p>
                                <button className="p-3 rounded-tr-xl bg-gray-100 rounded-bl-2xl transition-all duration-300 active:bg-gray-300" onClick={ () => setOpenConfig(false) }> 
                                    <X size={18} strokeWidth={1.5} />
                                </button>
                            </div>
                            <div className="p-6">
                                <InputComponent inputKey={`url`} config={config} setConfig={setConfig} label={'Machine URL'}/>
                                <InputComponent inputKey={`feedRate`} config={config} setConfig={setConfig} label={'Feed Rate'} limit={12000}/>
                                <InputComponent inputKey={`jogSpeed`} config={config} setConfig={setConfig} label={'Jog Speed'} limit={15000}/>
                            </div>

                            <div className="p-5 flex gap-4 w-full justify-around items-center">
                                <div className="grid grid-cols-3 gap-3">
                                    <JogButton className='col-start-2' gcode={`$J=G91 G21 F${ config.jogSpeed } Y10`} Icon={ChevronUp} />  
                                    <JogButton className='col-start-1' gcode={`$J=G91 G21 F${ config.jogSpeed } X-10`} Icon={ChevronLeft} />  
                                    <JogButton className='col-start-2' gcode={`$H`} Icon={Home} />  
                                    <JogButton className='col-start-3' gcode={`$J=G91 G21 F${ config.jogSpeed } X10`} Icon={ChevronRight} /> 
                                    <JogButton className='col-start-2' gcode={`$J=G91 G21 F${ config.jogSpeed } Y-10`} Icon={ChevronDown} />  
                                </div>
                                <div className="grid grid-cols-1 gap-3 h-fit">
                                    <JogButton className='col-start-1' gcode={`$J=G91 G21 F${ config.jogSpeed } Z1`} Icon={ChevronUp} />  
                                    <button className="p-2 bg-[#1C274C] rounded"><p className="text-white text-[10px]">Z-Axis</p></button>
                                    <JogButton className='col-start-1' gcode={`$J=G91 G21 F${ config.jogSpeed } Z-1`} Icon={ChevronDown} />  
                                </div>
                            </div>

                            <div className="text-sm responses mt-5 min-h-44 relative">
                                <textarea 
                                    ref={textareaRef} 
                                    value={ response.message } 
                                    className="cursor-default pb-1" 
                                    readOnly
                                />
                                
                                <div className="relative w-full">
                                    <input 
                                        ref={ gcodeRef }
                                        className="w-full bg-[#1e263f] p-2 rounded-md border border-[#ffffff69] outline-none text-sm" 
                                        placeholder="Enter You G-Code here" 
                                        onKeyDown={ (e) => { if (e.key === 'Enter') sendGcode() }}
                                    />
                                    <button 
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#2651d4] hover:bg-[#2d58da] active:bg-[#2651d4ce] transition-all duration-200 rounded p-1"
                                        onClick={ sendGcode }
                                    >
                                        <ArrowUp size={20} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                }
            </AnimatePresence>
        </>
    )
}