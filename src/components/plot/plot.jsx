/* eslint-disable react/prop-types */
import { useEffect, useRef, useCallback } from "react";
import { 
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Home,
    Power,
    // FileCog,
    Plug,
    Pencil,
    // Settings,
    // Settings2
    GripHorizontal,
    X
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
        setJob,
        config,
        setConfig,
        setupModal, 
        setSetupModal,
        setProgress,
        colors,
        openSocket
    } = useCom();
    const textareaRef = useRef(null)
    const gcodeRef = useRef(null)

    const returnObjs = (objects) => {
        const newObjects = []

        objects.forEach(obj => {
            if (obj.get('type') === 'group') {
                console.log('New OBJ -> ',obj)
                const groupObjects = obj.getObjects();

                groupObjects.forEach(innerObj => {
                    if (innerObj.get('type') === 'group') {
                        const groupObjects = returnObjs(innerObj.getObjects())
                        newObjects.push(...groupObjects);
                    } else {
                        newObjects.push(innerObj);
                    }
                })
            } else {
                newObjects.push(obj)
            }
        })

        return newObjects
    }

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

        const canvasObjects = canvas.getObjects();
        const objects = returnObjs(canvasObjects);

        const groupByStroke = {};
        objects.forEach(obj => {
            const stroke = tinycolor(obj.stroke);

            if (stroke) {
                if (!groupByStroke[stroke.toHexString()]) {
                    groupByStroke[stroke.toHexString()] = [];
                }
                groupByStroke[stroke.toHexString()].push(obj);
            }
        });

        const svgElements = []
        for (const stroke in groupByStroke) {
            let groupSVG = '';
            if (groupByStroke[stroke].length > 1) {

                groupByStroke[stroke].forEach(obj => {
                    const svg = obj.toSVG();
                    groupSVG += svg;
                });
            } else {
                const svg = groupByStroke[stroke][0].toSVG()
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

        setProgress({ uploading: false, converting: true, progress: 40 });
        await delay(500);

        const colorOrder = colors.reduce((acc, colorObject, index) => {
            acc[colorObject.color] = index
            return acc
        }, {})

        svgElements.sort((a, b) => {
            return colorOrder[a.color] - colorOrder[b.color]
        })

        
        const gcodes = await Promise.all(svgElements.map( async (element) => {
            const color = colors.find(obj => obj.color === element.color)
            let settings = {
                zOffset : config.zOffset,
                feedRate : config.feedRate,
                seekRate : config.feedRate,
                zValue: color.zValue,
                tolerance:1
            }
            const converter = new Converter(settings);
            const [ code ] = await converter.convert(element.svg);
            const gCodeLines = code.split('\n');

            const cleanedGcodeLines = gCodeLines.slice(0, -1);
            cleanedGcodeLines.splice(2, 2);
            return [color.command + '\n' + cleanedGcodeLines.join('\n')];
        }));

        setProgress({ uploading: false, converting: true, progress: 80 });
        await delay(500);

        gcodes.unshift('$H', 'G10 L20 P0 X0 Y0 Z0')
        gcodes.push('G0 X0Y0')
        console.log('Gcode Lines : \n', gcodes.join('\n'));

        // Send to Machine
        const blob = new Blob([gcodes.join('\n')], { type: 'text/plain' });
        const file = new File([blob], 'job.gcode', { type: 'text/plain' });

        const formData = new FormData();
        formData.append('file', file);
        
        try {

            setProgress({ uploading: true, converting: false, progress: 80  });
            await delay(500);

            const http = new XMLHttpRequest();
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
                        }, 3000);
                    }
                }
            }
            http.open("POST", `http://${ config.url }/upload`, true);
            http.send(formData);
        } catch (err) {
            console.error('Error While Uploading -> ', err);
        }
    }



    const sendToMachine = async (gcode) => {
        if (!ws) return;
        try {
            const url = `http://${ config.url }/command?commandText=` + encodeURI(gcode) + `&PAGEID=${response.pageId}`

            fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('HTTP ERROR! STATUS : ' + response.status);
                }
            })
            . catch (err => {
                console.error('Fetch Error : ', err)
            });

        } catch (err) {
            console.log(err);
        }
    }

    useEffect(() => {
        canvas.selection = false;
        canvas.discardActiveObject();
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

    const JogButton = ({gcode, Icon}) => {
        return (
            <button className="p-3 bg-[#1C274C] rounded flex justify-center items-center" onClick={ () => sendToMachine(gcode) }>
                <Icon size={20} strokeWidth={4} color={'#F5762E'} />
            </button>
        )
    }


    return (
        <>
        <div className="flex justify-between gap-8 max-[500px]:flex-col md:flex-col p-5 z-10 relative bg-white h-full pb-10">
            <div className="h-full cut w-full">
                <div 
                    className="w-full flex items-end  lg:justify-end gap-3 pb-4" 
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
                <div className="text-sm responses lg:h-[90%] min-h-44 relative">
                    <textarea ref={textareaRef} value={ response.message } className="cursor-default min-h-24 lg:pb-8" readOnly></textarea>
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
                <div className="flex  w-full justify-around items-center gap-16 pb-10">
                    <div className="flex flex-col items-center justify-center gap-3">
                        <JogButton gcode={`$J=G91 G21 F${ config.jogSpeed } Y10`} Icon={ChevronUp} />
                        <div className="flex gap-3">
                            <JogButton gcode={`$J=G91 G21 F${ config.jogSpeed } X-10`} Icon={ChevronLeft} />   
                            <button className="p-3 bg-[#1C274C] rounded" onClick={ () => sendToMachine('$H') }>
                                <Home size={20} strokeWidth={2} color={'#ffffff'}/>
                            </button>
                            <JogButton gcode={`$J=G91 G21 F${ config.jogSpeed } X10`} Icon={ChevronRight} />  
                        </div>
                        <JogButton gcode={`$J=G91 G21 F${ config.jogSpeed } Y-10`} Icon={ChevronDown} />  
                    </div>
                    <div className="flex flex-col h-full justify-between">
                        <JogButton gcode={`$J=G91 G21 F${ config.jogSpeed / 10 } Z1`} Icon={ChevronUp} />
                        <button className="p-2 bg-[#1C274C] rounded" onClick={ () => sendToMachine('$H') }>
                            <p className="text-white text-[10px]">Z-Axis</p>
                        </button>
                        <JogButton gcode={`$J=G91 G21 F${ config.jogSpeed / 10 } Z-1`} Icon={ChevronDown} />  
                    </div>
                </div>

                <div className="flex w-full items-end justify-between gap-1">
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

        </div>
        <div 
            className={`
                absolute lg:z-0 z-20 lg:w-fit h-full bg-white p-5 flex flex-col top-0 transition-all 
                duration-500 ${ config.open ? 'lg:right-96 right-0' : 'lg:right-0 -right-96' } 
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
                <InputComponent inputKey={`zOffset`} config={config} setConfig={setConfig} label={'Z - Offset'} limit={10}/>
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
                                        prevColor.map((clr, idx) =>
                                            idx === index ? {...clr, zValue: value } : clr
                                        )
                                    )
                                }}
                                onBlur={() => {
                                    // Convert to float when the input loses focus
                                    let value = parseFloat(color.zValue);
                                    if (isNaN(value)) value = 0;
                                    value = value > 20 ? 20 : value;

                                    // Update the state with the parsed float value
                                    setColors(prevColors =>
                                        prevColors.map((clr, idx) =>
                                            idx === index ? { ...clr, zValue: value } : clr
                                        )
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