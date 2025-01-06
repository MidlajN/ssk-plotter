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
    ArrowUp,
    MoreVertical
} from "lucide-react";
import useCanvas from "../../context/CanvasContext";
import useCom from "../../context/ComContext";
import { returnGroupedObjects, returnSvgElements, sortSvgElements, convertToGcode } from "../../util/convert";
import { motion } from "framer-motion";
import './plotter.css'
import { AnimatePresence } from "framer-motion";
import { PenIcon } from "../Icons";
import { util } from "fabric";

export const DimensionComponent = ({ plotCanvas }) => {
    const [ dimensions, setDimensions] = useState({ width: 0, height: 0, left:0, top: 0 });

    useEffect(() => {
        if (!plotCanvas) return;

        const getSelectionDimensions = () => {
            const activeObject = plotCanvas.getActiveObject();
            if (!activeObject) return;

            let width = null;
            let height = null;
            let left = null;
            let top = null;

            const canvasWidth = plotCanvas.getWidth();
            const canvasHeight = plotCanvas.getHeight();
            const boundingBox = activeObject.getBoundingRect(true);
            const objWidth = boundingBox.width;
            const objHeight = boundingBox.height;

            console.log(boundingBox)
            // Enforce boundaries
            if (boundingBox.left < 0) {
                // activeObject.left = 0; // Prevent moving past the left edge
                activeObject.left -= boundingBox.left;
            }
            if (boundingBox.top < 0) {
                activeObject.top = 0; // Prevent moving past the top edge
            }
            if (boundingBox.left + objWidth > canvasWidth) {
                activeObject.left = canvasWidth - objWidth; // Prevent moving past the right edge
            }
            if (boundingBox.top + objHeight > canvasHeight) {
                activeObject.top = canvasHeight - objHeight; // Prevent moving past the bottom edge
            }
            plotCanvas.renderAll();

            // let angle = null;
            if (activeObject && activeObject.type === 'activeSelection') {
                const boundingRect = activeObject.getBoundingRect(true); // true for absolute coordinates
                width = parseFloat(boundingRect.width * 25.4 / 96).toFixed(2); 
                height = parseFloat(boundingRect.height * 25.4 / 96).toFixed(2); 
                left = parseFloat(activeObject.left * 25.4 / 96).toFixed(2);
                top = parseFloat(activeObject.top * 25.4 / 96).toFixed(2);
            } else if (activeObject) {
                width = parseFloat(activeObject.getScaledWidth() * 25.4 / 96).toFixed(2);
                height = parseFloat(activeObject.getScaledHeight() * 25.4 / 96).toFixed(2);
                left = parseFloat(activeObject.left * 25.4 / 96).toFixed(2);
                top = parseFloat(activeObject.top * 25.4 / 96).toFixed(2);
            }
            setDimensions({ width: width ? width : 0, height: height ? height: 0, left: left ? left: 0, top: top ? top: 0});
        };
          
        plotCanvas.on('selection:created', getSelectionDimensions);
        plotCanvas.on('selection:updated', getSelectionDimensions);
        plotCanvas.on('selection:cleared', getSelectionDimensions);
        plotCanvas.on('object:moving', getSelectionDimensions);

        return () => {
            plotCanvas.off('selection:created', getSelectionDimensions);
            plotCanvas.off('selection:updated', getSelectionDimensions);
            plotCanvas.off('selection:cleared', getSelectionDimensions);
            plotCanvas.on('object:moving', getSelectionDimensions);
        }
          
    }, [plotCanvas])

    const changePos = (name, pos) => {
        const activeObject = plotCanvas.getActiveObject();
        const canvasWidth = plotCanvas.getWidth();
        const canvasHeight = plotCanvas.getHeight();
        const objWidth = activeObject.width;
        const objHeight = activeObject.height;
        const posInPX = util.parseUnit(`${pos}mm`)
        let position = null
        if (name === 'left') {
            position = posInPX < 0 ? 0 : posInPX > canvasWidth - objWidth ? canvasWidth - objWidth : posInPX
        } else if (name === 'top') {
            position = position = posInPX < 0 ? 0 : posInPX > canvasHeight - objHeight ? canvasHeight - objHeight : posInPX
        }

        setDimensions(prev => ({ ...prev, [name]: position * 25.4 / 96}))
        activeObject.set({
            [name]: position
        });
        plotCanvas.renderAll()
    }

    return (
        <>
            <div className="p-5 dimensions">
                <div className="flex gap-6 pb-2">
                    <p className="min-w-14">Width</p>
                    <p>{ dimensions.width } <span className="text-xs text-gray-500">mm</span></p>
                </div>
                <div className="flex gap-6 pb-2">
                    <p className="min-w-14">Height</p>
                    <p>{ dimensions.height } <span className="text-xs text-gray-500">mm</span></p>
                </div>
                <div className="flex gap-6 pb-2 mt-2">
                    <p className="min-w-14">X <span className="text-sm text-gray-500">pos.</span></p>
                    <input 
                        type="number"
                        className="bg-gray-100" 
                        value={ dimensions.left } 
                        onInput={(e) => changePos('left', e.target.value)} 
                        min={0}
                    />
                </div>
                <div className="flex gap-6 pb-2">
                    <p className="min-w-14">Y <span className="text-sm text-gray-500">pos.</span></p>
                    <input 
                        type="number" 
                        className="bg-gray-100"
                        value={ dimensions.top } 
                        onInput={(e) => changePos('top', e.target.value)} 
                        min={0}
                    />
                </div>
            </div>
        </>
    )
}

export const SettingsComponent = ({ openConfig, setOpenConfig }) => {
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

    const handlePopUp = () => {
        setOpenConfig(false)
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
                        className="fixed inset-0 flex items-center justify-center bg-opacity-50 z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={ handlePopUp }
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
                                <button className="p-3 rounded-tr-xl bg-gray-100 hover:bg-gray-50  rounded-bl-2xl transition-all duration-300 active:bg-gray-200" onClick={ () => setOpenConfig(false) }> 
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

                            <div className="text-sm responses mt-5 min-h-44">
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

export const StatusComponent = () => {
    const { job } = useCom();

    return (
        <>
            <div className="mx-3 my-3 px-1 py-1 pb-3 border-b border-white  flex items-center gap-2">
                <Info size={14} strokeWidth={2} color={'gray'} />
                { !job.started && !job.percentage ? (
                    <p className="text-sm text-gray">Currently No Job Is Running...</p>
                ) : (
                    <>
                        <div className="w-full bg-gray-200 rounded-full h-1 overflow-hidden">
                            <div 
                                className="h-full transition-all duration-500 animate-gradientMove" 
                                style={{ 
                                    width: `${job.percentage}%`, 
                                    background: `${job.percentage === 100 ? '#146a7e' : 'linear-gradient(10deg, #F5762E 40%, #ff925dd1 50%, #F5762E 57%)'}`,
                                    backgroundSize: '200% 100%'
                                }}
                            />
                        </div>
                        <p className="text-sm font-medium text-[#383838]">{job.percentage}%</p>
                        { job.percentage === 100 && <CheckCheck size={17} strokeWidth={2.5} color={'green'} /> }
                    </>  
                )}
            </div>
        </>
    )
}

export const ColorSortComponent = () => {
    const { colors, setColors } = useCom();
    const { canvas } = useCanvas();
    const dragDiv = useRef(0);
    const dragOverDiv = useRef(0);
    const [ drawnColors, setDrawnColors ] = useState([])
    const [ showMore, setShowMore ] = useState(null)

    const handleSort = () => {
        const cloneColors = [...drawnColors];
        const temp = cloneColors[dragDiv.current]
        cloneColors[dragDiv.current] = cloneColors[dragOverDiv.current];
        cloneColors[dragOverDiv.current] = temp

        const sortedColor = colors.sort((a, b) => {
            const indexA = cloneColors.findIndex(color => color.color === a.color)
            const indexB = cloneColors.findIndex(color => color.color === b.color)
            return indexA - indexB
        })
        setColors(sortedColor)
        setDrawnColors(cloneColors)
    }

    const handleColor = (color, value) => {
        setColors(prevColors => 
            prevColors.map(prevColor => (
                prevColor.color === color ? { ...prevColor, skipped: value } : prevColor
            ))
        )
        setShowMore(null)
    }

    useEffect(() => {
        const uniqueColors = [];
        canvas.getObjects().forEach((obj) => {
            const color = obj.get('stroke');
            if ( color && !uniqueColors.some(clr => clr.color === color )) {
                const result = colors.reduce((accumulator, currentColor) => {
                    if (currentColor.color === color) {
                        accumulator = {
                            name: currentColor.name,
                            skipped: currentColor.skipped
                        }
                    }
                    return accumulator
                }, null)
                uniqueColors.push({ color: color, name: result.name, skipped: result.skipped });
            }
        });

        const sortedColor = uniqueColors.sort((a, b) => {
            const indexA = colors.findIndex(color => color.color === a.color)
            const indexB = colors.findIndex(color => color.color === b.color)
            return indexA - indexB
        })
        setDrawnColors(sortedColor);
    }, [canvas, colors])

    return (
        <>
            { drawnColors.length >= 1 ? (
                <>
                    <div className="flex flex-col gap-2 m-2 p-4 rounded-md bg-[#f7f7f7] border border-[#eeeeee]">
                        { drawnColors.map((color, index) => (
                            <div 
                                key={index} 
                                className="flex gap-4 justify-between items-center py-2 border-b-2 bg-white px-1 rounded-md w-full" 
                                style={{ opacity: color.skipped ? 0.7 : 1}}
                                draggable
                                onDragStart={ () =>  ( dragDiv.current = index )}
                                onDragEnter={ () => { dragOverDiv.current = index }}
                                onDragEnd={ handleSort }
                                onDragOver={ (e) => { e.preventDefault() }}
                            >
                                <div className="flex gap-1 items-center pl-[2px] w-full relative">
                                    <GripHorizontal size={17} strokeWidth={2} color="gray" />
                                    <PenIcon stroke={ color.color } width={35} height={15} />

                                    <p className={`${ color.skipped ? 'text-gray-700' : 'text-[#035264]' } text-sm pl-2`}>
                                        {color.name} 
                                        { color.skipped && <span className="text-gray-500 text-[11px] italic"> &nbsp;&nbsp; skipped </span>}
                                    </p>

                                    <MoreVertical size={17} strokeWidth={2} color="gray" className="ml-auto cursor-pointer drop-shadow-md drop" onClick={() => setShowMore(index)} />
                                    
                                    { showMore === index && (
                                        <>
                                            <motion.div
                                                className="fixed inset-0 flex items-center justify-center bg-opacity-50"
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                onClick={ () => setShowMore(false) }
                                            />
                                            <motion.div
                                                className="absolute right-3 top-2 w-fit shadow-lg"
                                                initial={{ scale: 0.8, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                transition={{ duration: 0.3 }}
                                                onClick={(e) => e.stopPropagation()} // Prevent closing on popup click
                                            >
                                                <div className="flex flex-col bg-white shadow-md border rounded-md overflow-hidden">
                                                    { color.skipped ? (
                                                        <button className="pl-4 pr-10 text-start py-1 hover:bg-gray-50 active:bg-gray-100" onClick={ () => handleColor(color.color, false) }>Include</button>
                                                    ) : (
                                                        <button className="pl-4 pr-10 text-start py-1 hover:bg-gray-50 active:bg-gray-100" onClick={ () => handleColor(color.color, true) }>Skip</button>
                                                    )}
                                                    {/* <button className="pl-4 pr-10 text-start py-2 hover:bg-gray-50 active:bg-gray-100">Replace</button> */}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}

                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="text-[12px] max-w-80 mt-2 px-3 text-[#525252]">You can rearrange the colors in the order you prefer, and the plotter will draw them in the sequence you&apos;ve specified.</p>
                </>
            ) : (
                <>
                    <div className="p-5">
                        <p className="text-sm text-gray-700">No Objects to be drawn...</p>
                    </div>
                </>
            )}
        </>
    )
}

export const ActionButtonsComponent = ({ canvas }) => {
    // const { canvas } = useCanvas();
    const {
        config, job, setJob, colors, setSetupModal, setProgress,  
        openSocket, closeSocket, sendToMachine
    } = useCom();

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

        let groupedObjects = await returnGroupedObjects(canvas);
        console.log('groupedObjects :',groupedObjects)
        const cleanedObjects = Object.fromEntries(
            Object.entries(groupedObjects).filter(([color]) => {
                // console.log('color ::: ', color)
                return colors.some(item => item.color === color && !item.skipped)
            })
        )

        const svgElements = returnSvgElements(cleanedObjects, canvas.getWidth(), canvas.getHeight());
        sortSvgElements(svgElements, colors);

        setProgress({ uploading: false, converting: true, progress: 40 });
        await delay(500);

        const gcodes = await convertToGcode(svgElements, colors, config);
        console.log(
            'Gcode Generated : \n', gcodes.join('\n'), 
            // '\nSvgElements : ', canvas.toSVG()
        )

        setProgress({ uploading: false, converting: true, progress: 80 });
        await delay(500);

        // uploadToMachine(gcodes);
    };


    const ActionButton = ({ label, Icon, onclick, bgColor }) => {
        return (

            <motion.button
                style={{ background: bgColor }}
                className="flex items-center justify-center gap-1 py-3 px-6 rounded-md"
                onClick={ onclick }
                whileTap={{ scale: 0.95  }}
            >
                <Icon size={18} strokeWidth={2} color="#FFFFFF"/>
                <span className="text-[#ffffff] font-medium text-[16px]"> { label } </span>
            </motion.button>
        )
    }

    return (
        <>
            <div className={`flex items-end w-full  gap-1 justify-center`}>
                { !job.connected ? (
                    <ActionButton label={'Ready'} Icon={Plug} onclick={ plot } bgColor={'#0e505c'}/>
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
        </>
    )
}