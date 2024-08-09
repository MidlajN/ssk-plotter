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
        machineUrl,
        setupModal, 
        setSetupModal,
        openSocket,
        setProgress
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
        //     console.log('Data', data)
        //     svgElements.push(data);
        // }
        

        // const colorCommand = {
        //     "#ff0000" : {
        //         command: "G6.7",
        //         zValue: 17.9
        //     }, // Red
        //     "#0000ff" : {
        //         command: "G6.5",
        //         zValue: 17.6
        //     }, // Blue
        //     "#008000" : {
        //         command: "G6.8",
        //         zValue: 19.4
        //     }, // Green
        //     "#ffff00" : {
        //         command: "G6.1",
        //         zValue: 17
        //     }, // Yellow
        //     "#ffa500" : {
        //         command: "G6.6",
        //         zValue: 18
        //     }, // Orange
        //     "#800080" : {
        //         command: "G6.4",
        //         zValue: 19
        //     }, // Purple NEED TO CHANGE TO BROWN
        //     "#000000" : {
        //         command: "G6.2",
        //         zValue: 18.6
        //     }, // Black
        //     "#ffc0cb" : {
        //         command: "G6.3",
        //         zValue: 19.2
        //     }, // Pink
        // }

        
        // const gcodes = await Promise.all(svgElements.map( async (element) => {
        //     let settings = {
        //         zOffset : 5,
        //         feedRate : 10000,
        //         seekRate : 10000,
        //         zValue: colorCommand[element.color].zValue,
        //         tolerance: 1
        //     }
        //     const converter = new Converter(settings);
        //     const [ code ] = await converter.convert(element.svg);
        //     console.log('Converted Code From the NPM -> ', code);
        //     const gCodeLines = code.split('\n');

        //     // const cleanedGcodeLines = gCodeLines.slice(0, -5);
        //     const cleanedGcodeLines = gCodeLines.slice(0, -1);
        //     cleanedGcodeLines.splice(2, 1);
        //     return [ 'G0 Z0\n' + colorCommand[element.color].command + cleanedGcodeLines.join('\n')];
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

        const colorCommand = {
            "#ff0000" : {
                command: "G6.7",
                zValue: 17.9
            }, // Red
            "#0000ff" : {
                command: "G6.8",
                zValue: 19.1
            }, // Blue
            "#008000" : {
                command: "G6.4",
                zValue: 19.4
            }, // Green
            "#ffff00" : {
                command: "G6.1",
                zValue: 18
            }, // Yellow
            "#ffa500" : {
                command: "G6.2",
                zValue: 19.4
            }, // Orange
            "#800080" : {
                command: "G6.6",
                zValue: 19.4
            }, // Purple NEED TO CHANGE TO BROWN
            "#000000" : {
                command: "G6.1",
                zValue: 14
            }, // Black
            "#ffc0cb" : {
                command: "G6.3",
                zValue: 19.2
            }, // Pink
        }

        const canvasObjects = canvas.getObjects();
        const objects = returnObjs(canvasObjects);

        console.log('Object', objects)

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

        console.log('GrouByStroke', groupByStroke)

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

        console.log('SvgElements', svgElements)

        setProgress({ uploading: false, converting: true, progress: 40 });
        await delay(500);

        
        const gcodes = await Promise.all(svgElements.map( async (element) => {
            let settings = {
                zOffset : 5,
                feedRate : 10000,
                seekRate : 10000,
                zValue: colorCommand[element.color].zValue,
                tolerance: 0.1
            }
            const converter = new Converter(settings);
            const [ code ] = await converter.convert(element.svg);
            const gCodeLines = code.split('\n');

            // const cleanedGcodeLines = gCodeLines.slice(0, -5);
            const cleanedGcodeLines = gCodeLines.slice(0, -1);
            cleanedGcodeLines.splice(2, 1);
            return [ 'G90 G21\n G1 Z0 F1000\n' + colorCommand[element.color].command + cleanedGcodeLines.join('\n')];
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
            http.open("POST", `http://${ machineUrl }/upload`, true);
            http.send(formData);
        } catch (err) {
            console.log('Error While Uploading -> ', err);
        }
    }



    const sendToMachine = async (gcode) => {
        try {
            const url = `http://${ machineUrl }/command?commandText=` + encodeURI(gcode) + `&PAGEID=${response.pageId}`

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


    return (
        <div className="flex justify-between gap-8 flex-col h-full pb-6">
            <div className="mt-4 h-full bg-[#EBEBEB] cut hidden md:block">
                <div className="w-full h-[10%] bg-[#1e263f] flex items-end justify-end gap-3 p-3">
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
                <div className="flex flex-col items-center justify-center gap-3 pb-10">
                    <button 
                        className="p-3 bg-[#1C274C] rounded"
                        onClick={ () => {
                            sendToMachine(`$J=G91 G21 F2000 Y10`);
                        }}
                        >
                        <ChevronUp size={20} strokeWidth={4} color={'#F5762E'}/>
                    </button>
                    <div className="flex gap-3">
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => {
                                sendToMachine(`$J=G91 G21 F2000 X-10`);
                            }}>
                            <ChevronLeft size={20} strokeWidth={4} color={'#F5762E'}/>
                        </button>
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => sendToMachine('$H')} >
                            <Home size={20} strokeWidth={2} color={'#ffffff'}/>
                        </button>
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => {
                                sendToMachine(`$J=G91 G21 F2000 X10`);
                            }}>
                            <ChevronRight size={20} strokeWidth={4} color={'#F5762E'}/>
                        </button>
                    </div>
                    <button 
                        className="p-3 bg-[#1C274C] rounded"
                        onClick={ () => {
                            sendToMachine(`$J=G91 G21 F2000 Y-10`);
                        }}>
                        <ChevronDown size={20} strokeWidth={4} color={'#F5762E'}/>
                    </button>
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

