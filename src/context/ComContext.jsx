/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
import { 
    createContext, 
    useContext, 
    useEffect, 
    useRef, 
    useState, 
    useCallback 
} from "react";

const ComContext = createContext(null);
export default function useCom() {
    return useContext(ComContext);
}

export const CommunicationProvider = ({ children }) => {
    const [ response, setResponse ] = useState({ pageId: '', message: '' });
    const [ job, setJob ] = useState({ connecting: false, connected: false, started: false, paused: false, percentage: null });
    const [ progress, setProgress ] = useState({ uploading: false , converting: false, progress: 0 })
    const [ setupModal, setSetupModal ] = useState(false);
    const [ ws, setWs ] = useState(null);
    const [ plotterCanvas, setPlotterCanvas ] = useState(null)
    const [colors, setColors] = useState([
        { 
            color: '#5e5e5e', 
            name: 'Gray', 
            zValue: -25, 
            penPick: [ '; Gray' ],
            penDrop: [ '; Gray Finished' ],
            skipped: false
        },
        { 
            color: '#ffff00', 
            name: 'Yellow', 
            zValue: -25, 
            penPick: [ '; Yellow' ],
            penDrop: [ '; Yellow Finished' ],
            skipped: false
        },
        { 
            color: '#008000', 
            name: 'Green', 
            zValue: -25, 
            penPick: [ '; Green' ],
            penDrop: [ '; Green Finished' ],
            skipped: false
        },
        { 
            color: '#227fe3', 
            name: 'Blue', 
            zValue: -25, 
            penPick: [ '; Blue' ],
            penDrop: [ '; Blue Finished' ],
            skipped: false
        },
        { 
            color: '#a020f0', 
            name: 'Purple', 
            zValue: -25, 
            penPick: [ '; Purple' ],
            penDrop: [ '; Purple Finished' ],
            skipped: false
        },
        { 
            color: '#ffc0cb', 
            name: 'Pink', 
            zValue: -25, 
            penPick: [ '; Pink' ],
            penDrop: [ '; Pink Finished' ],
            skipped: false
        },
        { 
            color: '#ffa500', 
            name: 'Orange', 
            zValue: -25, 
            penPick: [ '; Orange' ],
            penDrop: [ '; Orange Finished' ],
            skipped: false
        },
        { 
            color: '#ff0000', 
            name: 'Red', 
            zValue: -25, 
            penPick: [ '; Red' ],
            penDrop: [ '; Red Finished' ],
            skipped: false
        },
        { 
            color: '#ff0000', 
            name: 'Red', 
            zValue: -25, 
            penPick: [ '; Red' ],
            penDrop: [ '; Red Finished' ],
            skipped: true
        },
    ]);
    const [ config, setConfig ] = useState({
        url: window.location.hostname,
        feedRate: 15000,
        jogSpeed: 12000,
        zOffset: 24,
        open: false
    });

    const dotRef = useRef();    

    const jogSpeedRef = useRef(config.jogSpeed);
    const pageIdRef = useRef(response.pageId);

    useEffect(() => {
        jogSpeedRef.current = config.jogSpeed;
        pageIdRef.current = response.pageId;
    }, [ config.jogSpeed, response.pageId ]);

    const openSocket = useCallback(() => {
        setSetupModal(true);
        if (ws !== null) return;
        try {
            setJob({ ...job, connecting: true, connected: false, started: false })
                
            const socket = new WebSocket(`ws://${ config.url }:81`, ['arduino']);
            socket.binaryType = 'arraybuffer';
            setWs(socket)

        } catch (err) {
            setWs(null);
        }
    }, [config.url, ws])

    const closeSocket = useCallback(() => {
        setProgress({ uploading: false, converting: false, progress: 0 });
        setJob({ ...job, connecting: false, connected: false, started:  false });
        setResponse({ ...response, pageId: ''})
        ws?.close();
        setWs(null);
    }, [ws])

    const sendToMachine = useCallback((gcode) => {
        let url = `http://${ config.url }/command?commandText=`;

        console.log(' Clicked : ', gcode);
        fetch(url + encodeURI(gcode) + `&PAGEID=${pageIdRef.current}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Http Error Status : ', response.status);
            }
        })
        .catch(err => {
            console.error('Fetch Error ->\n', err)
        });
    }, [config.url])

    const handleJog = useCallback((e) => {
        const { shiftKey, ctrlKey, key } = e;
        const jogCommands = {
            ArrowUp: {
                normal: `$J=G91 G21 F${ jogSpeedRef.current } Y10`,
                shift: `$J=G91 G21 F${ jogSpeedRef.current / 10 } Z1`,
                shiftCtrl: `$J=G91 G21 F${ jogSpeedRef.current / 10 } Z.1`
            },
            ArrowDown: {
                normal: `$J=G91 G21 F${ jogSpeedRef.current } Y-10`,
                shift: `$J=G91 G21 F${ jogSpeedRef.current / 10 } Z-1`,
                shiftCtrl: `$J=G91 G21 F${ jogSpeedRef.current / 10 } Z-.1`
            },
            ArrowLeft: {
                normal: `$J=G91 G21 F${ jogSpeedRef.current } X-10`,
            },
            ArrowRight: {
                normal: `$J=G91 G21 F${ jogSpeedRef.current } X10`,
            }
        }

        if (jogCommands[key]) {
            e.preventDefault();
            if (shiftKey && ctrlKey && jogCommands[key].shiftCtrl) {
                sendToMachine(jogCommands[key].shiftCtrl);
            } else if (shiftKey && jogCommands[key].shift) {
                sendToMachine(jogCommands[key].shift);
            } else if (jogCommands[key].normal) {
                sendToMachine(jogCommands[key].normal);
            }
        }
    },[sendToMachine])

    useEffect(() => {
        if (!ws) return;

        const handleSocketOpen = () => {
            setJob({ ...job, connecting: false, connected: true, started: false });
            setTimeout(() => { setSetupModal(false) }, 3000);

            if (!window._keydownListenerAdded) {
                window.addEventListener('keydown', handleJog)
                window._keydownListenerAdded = true;
            }
        }

        const handleSocketMessage =  (message, gcode = null) => {

            if (message.startsWith('<')) {
                const data = message.match(/<([^>]+)>/)[1];
                const [ status, position, feed ] = data.split('|');
                const sdPercent = data.split('|').pop().includes('SD') ? data.split('|').pop() : null
                const percentage = sdPercent ? parseInt(sdPercent.split(',')[0].split(':')[1]) : null
                setJob(prev => ({ ...prev, percentage:  percentage === null && prev.started ? 100 : percentage }))

                const coords = position.split(':')[1];
                const [ x, y, z ] = coords.split(',').map(parseFloat);
 
                // SD:100.00,/sd/job.gcode
                // console.log(
                //     'Data : ', data,
                //     '\nSplits : ', data.split('|'),
                //     '\nSD Percent : ', sdPercent, ' <-> ', percentage
                // );

                dotRef.current.set({
                    top: (310 - y) * 96 / 25.4,
                    left: (430 + x) * 96 / 25.4,
                });
                plotterCanvas.renderAll();

                // console.log(`Status: ${status}\nX: ${x} Y: ${y} Z: ${z} Feed: ${feed}\n`);
            } else {
                if (message.includes('/job.gcode job sent')) {
                    console.log('The Indicator found', job);

                    // setTimeout(() => { setJob({ ...job, connecting: false, connected: true, percentage: 100 }) }, 5000)
                    setTimeout(() => { setJob({ ...job, started: false, percentage: null }) }, 7000)
                }

                setResponse(prev => ({
                    ...prev,
                    message: prev.message + message
                }));

            }
    
            if (gcode) sendToMachine(gcode);
        }

        const handleBlob = (event) => {
            const reader = new FileReader();
            reader.onload = () => {
                const text = reader.result;
                handleSocketMessage(text);
            }
            reader.readAsText(event.data)
        }

        const handleArrayBuffer = (event) => {
            const arrayBuffer = event.data;
            const uint8array = new Uint8Array(arrayBuffer)
            const text = new TextDecoder().decode(uint8array);
            const [key, valueStr] = text.split(':', 2);
            if (!valueStr) return;
            const value = parseInt(valueStr.trim());

            if(!isNaN(value)) {
                switch (true) {
                    case key === 'error' && value === 8:
                        handleSocketMessage('The Machine is in Alarm state \nChanging...\n', '$X');
                        break;
                    case key === 'error' && value === 152:
                        handleSocketMessage('Boot Error \nRestarting...\n', '$bye');
                        setTimeout(() => {
                            ws.close();
                            setJob({ ...job, connected: false})
                        }, [5000])
                        break;
                    case key === 'ALARM' && value === 1:
                        handleSocketMessage('Hard Limit Triggered \nRe-Homing...\n', '$H');
                        break;
                    case key === 'ALARM' && value === 8:
                        handleSocketMessage('Hard Limit Triggered \nRe-Homing...\n', '$X\nG1 X10Y10Z-10 F3000\n$H');
                        break;
                    default:
                        break;
                }
            } 
            handleSocketMessage(text);
        }

        const handleText = (event) => {
            const [key, value] = event.data.split(':');

            if (key !== 'PING') {
                console.log(key, parseInt(value, 10));
                setResponse(prev => ({ 
                    pageId: parseInt(value, 10), 
                    message: prev.message + event.data + "\n"
                }));
            }
        }

        const handleSocketClose = () => {
            setWs(null);
            setJob({ ...job, connected: false, connecting: false, started: false });
            setResponse(prev => ({ ...prev, message: prev.message + 'Socket Connection Closed ... \n' }));

            window.removeEventListener('keydown', handleJog);
            window._keydownListenerAdded = false;
        }

        const handleSocketError = (err) => {
            console.error('Socket error :-> ', err);
            setJob({ ...job, connected: false, connecting: false, started: false })
        }

        ws.onopen = handleSocketOpen;

        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                handleBlob(event);
            } else if (event.data instanceof ArrayBuffer) {
                handleArrayBuffer(event);
            } else {
                handleText(event)
            }
        }

        ws.onclose = handleSocketClose;
        ws.onerror = handleSocketError;

    }, [handleJog, job, sendToMachine, ws])


    return (
        <ComContext.Provider 
            value={{
                response,
                setResponse,
                job,
                setJob,
                ws,
                setWs,
                setupModal, 
                setSetupModal,
                progress, 
                setProgress,
                colors,
                setColors,
                config,
                setConfig,
                openSocket,
                closeSocket,
                sendToMachine,
                plotterCanvas, 
                setPlotterCanvas,
                dotRef
            }}
        >
            { children }
        </ComContext.Provider>
    )

}