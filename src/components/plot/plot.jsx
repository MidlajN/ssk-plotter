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
        // const objects = canvas.getObjects();
        // const newObjs = returnObjs(objects);

        // const groupByStroke = {};

        // newObjs.forEach(obj => {
        //     const stroke = tinycolor(obj.stroke);

        //     if (stroke) {
        //         if (!groupByStroke[stroke.toHexString()]) {
        //             groupByStroke[stroke.toHexString()] = [];
        //         }
        //         groupByStroke[stroke.toHexString()].push(obj);
        //     }
        // });

        // const svgElements = []
        // for (const stroke in groupByStroke) {
        //     let groupSVG = '';
        //     if (groupByStroke[stroke].length > 1) {

        //         groupByStroke[stroke].forEach(obj => {
        //             const svg = obj.toSVG();
        //             groupSVG += svg;
        //         });
        //     } else {
        //         const svg = groupByStroke[stroke][0].toSVG()
        //         groupSVG += svg
        //     }

        //     const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        //     svg.setAttribute('viewBox', `0 0 ${ canvas.getWidth() } ${ canvas.getHeight() }`);
        //     svg.innerHTML = groupSVG;

        //     const data = {
        //         color : stroke,
        //         svg : svg.outerHTML
        //     }
        //     // console.log('Data', data)
        //     svgElements.push(data);
        // }
        
        // const colorOrder = colors.reduce((acc, colorObject, index) => {
        //     acc[colorObject.color] = index
        //     return acc
        // }, {})
        // console.log('Color Object -> ', colorOrder)
        // console.log('SvgElements Before ->', svgElements)

        // svgElements.sort((a, b) => {
        //     return colorOrder[a.color] - colorOrder[b.color]
        // })
        // console.log('SvgElements After -> ', svgElements)

        // const gcodes = await Promise.all(svgElements.map( async (element) => {
        //     const color = colors.find(obj => obj.color === element.color)
        //     let settings = {
        //         zOffset : 5,
        //         feedRate : 10000,
        //         seekRate : 10000,
        //         zValue: color.command,
        //         tolerance: 1
        //     }
        //     const converter = new Converter(settings);
        //     const [ code ] = await converter.convert(element.svg);
        //     // console.log('Converted Code From the NPM -> ', code);
        //     const gCodeLines = code.split('\n');

        //     // const cleanedGcodeLines = gCodeLines.slice(0, -5);
        //     const cleanedGcodeLines = gCodeLines.slice(0, -1);
        //     cleanedGcodeLines.splice(2, 1);
        //     return [ 'G0 Z0\n' + color.command + cleanedGcodeLines.join('\n')];
        // }));

        // gcodes.unshift('$H', 'G10 L20 P0 X0 Y0 Z0')
        // gcodes.push('G0 X0Y0')
        // console.log('Gcode Lines : ', gcodes.join('\n'));

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
            console.log('Data', data)
            svgElements.push(data);
        }

        setProgress({ uploading: false, converting: true, progress: 40 });
        await delay(500);

        const colorOrder = colors.reduce((acc, colorObject, index) => {
            acc[colorObject.color] = index
            return acc
        }, {})
        console.log('Color Object -> ', colorOrder)
        console.log('SvgElements Before ->', svgElements)

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
                tolerance: 0.1
            }
            const converter = new Converter(settings);
            const [ code ] = await converter.convert(element.svg);
            const gCodeLines = code.split('\n');

            // const cleanedGcodeLines = gCodeLines.slice(0, -5);
            const cleanedGcodeLines = gCodeLines.slice(0, -1);
            cleanedGcodeLines.splice(2, 1);
            return [ 'G90 G21\n G1 Z0 F1000\n' + color.command + cleanedGcodeLines.join('\n')];
        }));

        setProgress({ uploading: false, converting: true, progress: 80 });
        await delay(500);

        gcodes.unshift('$H', 'G10 L20 P0 X0 Y0 Z0')
        gcodes.push('G0 X0Y0')
        console.log('Gcode Lines : ', gcodes.join('\n'));

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
                    console.log('Http Request -> ', http)
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
        <div className="flex justify-between gap-8 flex-col h-full pb-6">
            <div className="mt-4 h-full bg-[#EBEBEB] cut hidden md:block">
                <div className="w-full h-[10%] bg-[#1e263f] flex items-end justify-end gap-3 p-3" onClick={ () => { setConfig({ ...config, open: true })} }>
                    <FileCog size={20} strokeWidth={2} color={'#ffffff'}  /> 
                </div>
                <div className="text-sm responses h-[90%] relative">
                    <textarea ref={textareaRef} value={ response.message } className="cursor-default" readOnly></textarea>
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
                <div className="flex  w-full justify-around items-center pb-10">
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
                        <JogButton gcode={`$J=G91 G21 F${ config.jogSpeed } Z1`} Icon={ChevronUp} />
                        <button className="p-2 bg-[#1C274C] rounded" onClick={ () => sendToMachine('$H') }>
                            <p className="text-white text-[10px]">Z-Axis</p>
                        </button>
                        <JogButton gcode={`$J=G91 G21 F${ config.jogSpeed } Z-1`} Icon={ChevronDown} />  
                    </div>
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

        </div>
    )
}

