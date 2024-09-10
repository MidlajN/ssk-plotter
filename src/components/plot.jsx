/* eslint-disable react/prop-types */
import { useEffect, useRef, useCallback } from "react";
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
    Pause,
    Play,
    Info,
    CheckCheck
} from "lucide-react";
import useCanvas, { useCom } from "../context";
import { SetupModal } from "./modal";
import tinycolor from "tinycolor2";
import { Converter } from "svg-to-gcode";


export const Plot = () => {
    const { canvas } = useCanvas();
    const {
        response, config, setConfig, setupModal, job, setJob, colors,
        setSetupModal, setProgress,  openSocket, closeSocket, sendToMachine
    } = useCom();

    const textareaRef = useRef(null)
    const gcodeRef = useRef(null)

    const returnObjs = (objects) => {
        const newObjects = []

        const processObject = (object, transformMatrix = null) => {
            if (object.get('type') ===  'group') {
                object.getObjects().forEach(innerObject => {
                    processObject(innerObject, object.calcTransformMatrix())
                });
            } else {
                object.clone(clonedObject => {
                    if (transformMatrix) {
                        const originalLeft = clonedObject.left;
                        const originalTop = clonedObject.top;
    
                        clonedObject.set({
                            left: originalLeft * transformMatrix[0] + originalTop * transformMatrix[2] + transformMatrix[4],
                            top: originalLeft * transformMatrix[1] + originalTop * transformMatrix[3] + transformMatrix[5],
                            angle: clonedObject.angle + object.angle,
                            scaleX: clonedObject.scaleX * object.scaleX,
                            scaleY: clonedObject.scaleY * object.scaleY
                        })
                    }
                    newObjects.push(clonedObject);
                })  
            }
        }

        objects.forEach(obj => {
            if (obj.get('name') !== 'ToolHead') processObject(obj);
        })

        return newObjects
    }

    const returnGroupedObjects = () => {
        // const objects = returnObjs(canvas.getObjects());

        return returnObjs(canvas.getObjects()).reduce((acc, object) => {
            const stroke = tinycolor(object.stroke).toHexString();
            acc[stroke] = acc[stroke] || [];
            // if (!acc[stroke]) acc[stroke] = [];
            acc[stroke].push(object)
            return acc
        }, {});
    }

    const returnSvgElements = (objects) => {
        const svgElements = []

        for (const stroke in objects) {
            let groupSVG = '';
            if (objects[stroke].length > 1) {

                objects[stroke].forEach(obj => {
                    const svg = obj.toSVG();
                    groupSVG += svg;
                });
            } else {
                const svg = objects[stroke][0].toSVG()
                groupSVG += svg
            }

            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', `0 0 ${ canvas.getWidth() } ${ canvas.getHeight() }`);
            svg.innerHTML = groupSVG;

            const data = {
                color : stroke,
                svg : svg.outerHTML
            }
            svgElements.push(data);
        }

        return svgElements
    }

    const sortSvgElements = (svgElements) => {
        const colorOrder = colors.reduce((acc, colorObject, index) => {
            acc[colorObject.color] = index
            return acc
        }, {});

        svgElements.sort((a, b) => colorOrder[a.color] - colorOrder[b.color]);
    }

    const convertToGcode = async (svgElements) => {
        const gcodes = await Promise.all(svgElements.map( async (element) => {
            const color = colors.find(objects => objects.color === element.color);

            let settings = {
                zOffset: config.zOffset,
                feedRate: config.feedRate,
                seekRate: config.seekRate,
                zValue: color.zValue,
                tolerance: 0.1
            }

            const converter = new Converter(settings);
            const [ code ] = await converter.convert(element.svg);
            const gCodeLines = code.split('\n');

            const filteredGcodes = gCodeLines.filter(command => command !== `G1 F${config.feedRate}`);

            const cleanedGcodeLines = filteredGcodes.slice(0, -1);
            cleanedGcodeLines.splice(0, 4);
            cleanedGcodeLines.splice(1, 1);

            return color.command + '\n' + cleanedGcodeLines.join('\n');
        }));

        return ['$H', 'G10 L20 P0 X0 Y0 Z0', `G1 F${config.feedRate}`, 'G0 X50Y50\n', ...gcodes, 'G0 X680Y540']
    }

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

        const svgElements = returnSvgElements(returnGroupedObjects());
        sortSvgElements(svgElements);

        setProgress({ uploading: false, converting: true, progress: 40 });
        await delay(500);

        const gcodes = await convertToGcode(svgElements);
        console.log('G-Code :', gcodes.join('\n'));

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
            canvas.getObjects().forEach(obj => obj.set({ selectable: true }));
        };
    }, [canvas]);

    // Scroll the textarea to the bottom when it overflows
    useEffect(() => {
        if ( textareaRef.current ) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [response.message]);

    const JogButton = ({gcode, Icon, className}) => {
        return (
            <button className={`${className} p-3 bg-[#1C274C] rounded flex justify-center items-center`} onClick={ () => sendToMachine(gcode) }>
                <Icon size={20} strokeWidth={gcode === '$H' ? 2 : 4} color={gcode === '$H' ? '#ffffff' : '#F5762E'} />
            </button>
        )
    }

    const ActionButton = ({ label, Icon, onclick, bgColor }) => {
        return (
            <button className={`flex items-center justify-center gap-1 py-3 px-8 rounded-md`} style={{ background: bgColor }} onClick={ onclick }>
                <Icon size={18} strokeWidth={2} color="#FFFFFF"/>
                <span className="text-[#ffffff] font-medium text-[16px]"> { label } </span>
            </button>
        )
    }

    return (
        <>
        <div className="flex justify-between gap-4 max-[750px]:flex-col lg:flex-col p-5 z-[2] relative bg-white h-full pb-10">
            <div className="cut w-full">
                <div 
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
                </div>

                <div className="px-3 py-4 border-b border-white bg-[#2a334e] flex items-center gap-2">
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
                </div>

                <div className="text-sm responses lg:h-[25rem] min-h-44 relative">
                    <textarea 
                        ref={textareaRef} 
                        value={ response.message } 
                        className="cursor-default min-h-22 lg:pb-8" 
                        readOnly
                    />
                    
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
            <div className="flex flex-col items-center justify-center gap-5 px-6 lg:px-1 min-w-fit">
                <div className="flex gap-4 w-full justify-around items-center">
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
                absolute lg:z-0 z-10 lg:w-fit h-full bg-white p-5 flex flex-col top-0 transition-all 
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
            <p className="text-[12px] max-w-80 mt-2 px-2 text-[#525252]">You can rearrange the colors in the order you prefer, and the plotter will draw them in the sequence you&apos;ve specified.</p>
        </>
    )
}