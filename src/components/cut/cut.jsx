/* eslint-disable react/prop-types */
import { useEffect, useRef, useState } from "react";
import { 
    Trash2, 
    ChevronLeft,
    ChevronRight,
    ChevronUp,
    ChevronDown,
    Home,
    Power,
    Dot,
    Pause,
    ActivityIcon,
    FileCog,
} from "lucide-react";
import useCanvas from "../../context";
import { Converter } from "svg-to-gcode";
import './cut.css';


export const Cut = ({ jobSetUp, setJobSetup }) => {
    const { canvas } = useCanvas();
    const textareaRef = useRef(null)
    const gcodeRef = useRef(null)
    const [ port , setPort ] = useState(null);
    const [ writer, setWriter ] = useState(null);
    const [ reader, setReader ] = useState(null);
    const [ controllers, setControllers ] = useState({x: 0, y: 0});
    const [ response, setResponse ] = useState({ visible: false, message: '' });


    const [ pause, setPause ] = useState(false);
    const [ index, setIndex ] = useState({jobIndex: 0, arrayIndex: 0});
    const [ isRunning, setIsRunning ] = useState(false);
    let ws = null;
    const array = [
        // {type: 'thru-cut', gcode: ['G01 X0Y0Z5.25', 'G01 X100Y100', 'G01 X100Y100Z0', 'G01 X100Y200', 'G01 X100Y200Z10.5', 'G01 X200Y200', 'G01 X200Y200Z21', 'G01 X200Y100', 'G01 X200Y100Z31.5', 'G01 X100Y100', 'G01 X100Y100Z25.75', 'G01 X0Y0', 'G01 X0Y0Z0']},
        // {type: 'thru-cut', gcode: ['M10S90', 'M10S140', 'M03S1200', 'M03S1500']},
        {
            type: 'thru-cut', 
            gcode: [
                'G28',
                'G00 X300Y20Z0', 
                'M10S90', 
                'G00 X300Y20Z25.5', 
                'M10S140', 
                'G00 X300Y20Z0', 
                'G00 X221Y14Z0', 
                'G00 X221Y14Z15', 
                'G00 X221Y14Z0',
                'G00 X43Y51Z0',
                'M03 S1800',
                'G00 X43Y51Z20',
                'G01 X126Y51Z20F2000',
                'G01 X126Y134Z20F2000',
                'G01 X43Y134Z20F2000', 
                'G01 X43Y51Z20F2000',
                'G00 X43Y51Z0',
                'M05',
                // 'G28',
                'G00 X330Y19.5Z0', 
                'G00 X330Y19.5Z25.5',
                'M10S90', 
                'G00 X330Y19.5Z0', 
                'M10S140', 
                'G00 X0Y0Z0'
            ]
        },
    ];


    useEffect(() => {
        console.log("Setup :: ", jobSetUp);
    }, [jobSetUp]);











    const processMsg = async (msg = null) => {
        if (ws) {
            ws.onmessage = (event) => {
                console.log("EVENT : ", event.data)
                if (event.data instanceof ArrayBuffer) {
                    const arrayBuffer = event.data;
                    const text = `${ msg ? msg + ' -> ': '' }${ new TextDecoder().decode(arrayBuffer) }\n`;
                    setResponse(prev => ({ ...prev, message: prev.message + text }));

                } else {
                    setResponse(prev => ({ ...prev, message: prev.message + event.data + "\n" }));
                }
            }

            ws.onclose = () => {
                setResponse(prev => ({ ...prev, message: `Socket Connection Closed ... \nSocket URL : ws://kochund.local:81 \n` }));
            }
        }
    }

    const handleConnection = async () => {
        try {
            ws = new WebSocket("ws://kochund.local:81", ['arduino']);

            ws.binaryType = 'arraybuffer';

            ws.onopen = () => {
                setResponse({ visible: true, message: `Socket Connection Successful ... \nSocket URL : ws://kochund.local:81 \n` });
                processMsg();
            }

        } catch (err) {
            console.log("Error while connecting", err)
        }
    }

    const closeConnection = async () => {
        ws.close();
        // if (port) {
        //     await reader.releaseLock();
        //     await writer.releaseLock();
        //     await port.close();
        //     console.log('Port Closed Successfully >>>')
        //     setPort(null);
        // }
    }

    const handleJob = async () => {

        const svgElements = jobSetUp.map((job) => {
            const obj = job.objects.toSVG();
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', `0 0 ${ canvas.getWidth() } ${ canvas.getHeight() }`);
            svg.innerHTML = obj;
            const element = {
                type: job.type,
                svg: svg.outerHTML
            }

            return element;
        })

        let commands = ''
        const converter = new Converter();
        console.log('svgElements', svgElements)
        svgElements.forEach((element) => {
            converter.convert(element.svg).then((gcode) => {
                commands = commands + gcode + '\n';
                // console.log('gcode', gcode)
                // console.log('commands', commands)
            })
        })

        const gcodes = await Promise.all(svgElements.map((element) => converter.convert(element.svg)));

        console.log('gcodes', gcodes.join('\n'));
        
        
        // converter.convert()

        

        // jobSetUp.forEach((job) => {
        //     console.log('job', job)
        //     const obj = job.objects.toSVG();
        //     // console.log('obj', obj)
        //     const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        //     svg.viewBox = `0 0 ${ canvas.getWidth() } ${ canvas.getHeight() }`;
        //     svg.innerHTML = obj;
        //     console.log('svg', svg)
        // })



        // if (isRunning) {
        //     setIsRunning(false);
        //     return;
        // }
        // setIsRunning(true);
    }


    const sendGCode = () => {
        const current = index.arrayIndex;
        if (!pause) {
            setTimeout(() => {
                console.log('current',array[index.jobIndex], current, index)
                if ( current == array[index.jobIndex]['gcode'].length) {
                    if ( index.jobIndex === array.length - 1) {
                        setIsRunning(false);
                        setIndex({jobIndex: 0, arrayIndex: 0});
                    } else {
                        setIndex({jobIndex: index.jobIndex + 1, arrayIndex: 0});
                    }
                } else {
                    sendToMachine(array[index.jobIndex]['gcode'][current])
                    setIndex({jobIndex: index.jobIndex, arrayIndex: current + 1});
                }
                console.log('array \n index: ', index)
            }, 1000);
        }
    }

    const sendToMachine = async (gcode) => {
        try {
            const http = new XMLHttpRequest();
            http.onreadystatechange = () => {
                if (http.readyState === 4) {
                    console.log(http);
                    if (http.status === 200) {
                        console.log(http.responseText); // Log the response from ESP_GRBL server
                    }
                }
            }
            http.open("GET", "http://kochund.local/command?commandText=" + encodeURI(gcode) + "&PAGEID=0", true);
            http.send();

        } catch (err) {
            console.log(err);
        }
    }


    // useEffect(() => {
    //     processMsg();
    // }, [reader]);

    useEffect(() => {
        if (isRunning && !pause) {
            sendGCode()
        }
    },[isRunning, pause, index])

     // Scroll the textarea to the bottom when it overflows
    useEffect(() => {
        if ( textareaRef.current ) {
            textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
        }
    }, [response.message]);


    return (
        <div className="flex justify-between gap-8 flex-col h-full pb-6">
            <div className="mt-4 h-full bg-[#EBEBEB] cut">
                <div className="w-full h-[10%] bg-[#1e263f] flex items-end justify-end gap-3 p-3">
                <FileCog size={20} strokeWidth={2} color={'#ffffff'}  />
                    <ActivityIcon 
                        size={20} 
                        strokeWidth={2} 
                        color={'#ffffff'} 
                        onClick={ () => { setResponse(prev => ({ ...prev, visible: !response.visible })) }} />
                </div>
                { response.visible ? 
                    <div className="text-sm responses h-[90%] relative">
                        <textarea ref={textareaRef} defaultValue={ response.message } ></textarea>
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
                 : 
                    jobSetUp.map((item, index) => {
                        return (
                            <div key={index} className={ `flex justify-between items-end py-1 px-3 border-b border-b-[#1c274c28] hover:bg-[#d6d6d6ab] ${ item.selected ? ' opacity-100' : 'opacity-50'}` } >
                                <p className="font-['MarryWeatherSansRegular'] text-[13px]">{ item.name }</p>
                                <div className="flex gap-3 py-1">
                                    <Trash2 
                                        size={15} 
                                        strokeWidth={2} 
                                        onClick={ () => setJobSetup(jobSetUp.filter((item, i) => i !== index)) }
                                        cursor={'pointer'}
                                    />
                                </div>
                            </div>
                        )
                    })
                }
                
            </div>
            <div className="flex flex-col items-center justify-center gap-5">
                <div className="flex flex-col items-center justify-center gap-3 pb-10">
                    <button 
                        className="p-3 bg-[#1C274C] rounded"
                        onClick={ () => {
                            sendToMachine(`G00 X${controllers.x} Y${controllers.y}`);
                            setControllers({...controllers, y: controllers.y + 10});
                        }}
                        >
                        <ChevronUp size={20} strokeWidth={4} color={'#F5762E'}/>
                    </button>
                    <div className="flex gap-3">
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => {
                                sendToMachine(`G00 X${controllers.x} Y${controllers.y}`);
                                setControllers({...controllers, x: (controllers.x - 10) < 0 ? 0 : controllers.x - 10});
                            }}>
                            <ChevronLeft size={20} strokeWidth={4} color={'#F5762E'}/>
                        </button>
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => sendToMachine('G28')} >
                            <Home size={20} strokeWidth={2} color={'#ffffff'}/>
                        </button>
                        <button 
                            className="p-3 bg-[#1C274C] rounded"
                            onClick={ () => {
                                sendToMachine(`G00 X${controllers.x} Y${controllers.y}`);
                                setControllers({...controllers, x: controllers.x + 10});
                            }}>
                            <ChevronRight size={20} strokeWidth={4} color={'#F5762E'}/>
                        </button>
                    </div>
                    <button 
                        className="p-3 bg-[#1C274C] rounded"
                        onClick={ () => {
                            sendToMachine(`G00 X${controllers.x} Y${controllers.y}`);
                            setControllers({...controllers, y: (controllers.y - 10) < 0 ? 0 : controllers.y - 10});
                        }}>
                        <ChevronDown size={20} strokeWidth={4} color={'#F5762E'}/>
                    </button>
                </div>

                <div className="flex w-full items-end justify-between">
                    { !port ? (
                        <button className="flex items-center justify-center gap-1 bg-[#0c4653] py-1 px-8 rounded-full" onClick={ handleConnection }>
                            <Power size={18} strokeWidth={4} color="#FFFFFF" /> 
                            <span className="text-[#ffffff] font-['MarryWeatherSans'] text-[13px] "> Connect</span>
                        </button>
                    ) : (
                        <button className="flex items-center justify-center gap-1 bg-[#d41d1d] py-1 px-6 rounded-full" onClick={ closeConnection }>
                            <Power size={18} strokeWidth={4} color="#FFFFFF" /> 
                            <span className="text-[#FFFFFF] font-['MarryWeatherSans'] text-[14px] "> Disconnect</span>
                        </button>
                    )}
                    <p className="flex items-center gap-1">
                        <Dot size={20} strokeWidth={4} className={!port ? 'text-[#d41d1d]' : 'text-[#2c944f]'} /> 
                        <span className={`text-[12px] ${!port ? 'text-[#d41d1d]' : 'text-[#2c944f]'}`}>{ port ? 'Device Connected' : 'No Device Connected'}</span>
                    </p>
                </div>

                <div className="flex justify-between w-full">
                    <button className="flex items-center justify-center gap-1 bg-[#027200] py-1 px-5 rounded text-nowrap"  onClick={ handleJob }>
                        <span className="text-[#FFFFFF] font-['MarryWeatherSans'] text-[12px] tracking-wide"> Start Job</span>
                    </button>
                    <button className="flex items-center justify-center gap-1 bg-[#1C274C] py-1 px-5 rounded" onClick={ () => { setPause(!pause) }}>
                        <Pause size={18} strokeWidth={2} fill="#FFFFFF" color="#FFFFFF" /> 
                        <span className="text-[#FFFFFF] font-['MarryWeatherSans'] text-[14px] tracking-wide"> Pause</span>
                    </button>
                    <button 
                        className="flex items-center justify-center gap-1 bg-[#BE0A0A] py-1 px-5 rounded-full"  
                        onClick={ () => {
                            setIsRunning(false);
                            setIndex({jobIndex: 0, arrayIndex: 0});
                        }}>
                        <Power size={18} strokeWidth={4} color="#FFFFFF" /> 
                        <span className="text-[#FFFFFF] font-['MarryWeatherSans'] text-[14px] tracking-wide"> Stop</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

