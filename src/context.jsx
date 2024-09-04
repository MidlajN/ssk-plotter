/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import { handleKeyDown } from "./components/editor/functions";
import 'fabric-history';

const CanvasContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export default function useCanvas() {
    return useContext(CanvasContext);
}

export const CanvasProvider = ({ children }) => {
    const canvasRef = useRef(null);
    const [ canvas, setCanvas ] = useState(null);
    const [ objectValues, setObjectValues ] = useState({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotateAngle: 0 });
    const [ copiedObject, setCopiedObject ] = useState(null);
    

    useEffect(() => {
        fabric.Object.prototype.cornerStyle = 'circle';
        fabric.Object.prototype.cornerColor = '#7f77eb85';
        fabric.Object.prototype.transparentCorners = false;
        fabric.Object.prototype.cornerSize = 15;
        fabric.Object.prototype.borderScaleFactor = 3;
        fabric.Object.prototype.noScaleCache = true;

        const fabricCanvas = new fabric.Canvas(canvasRef.current, {
            width: fabric.util.parseUnit('680mm'),
            height: fabric.util.parseUnit('540mm'),
            backgroundColor: "white",
            fireRightClick: true,
            stopContextMenu: true,
        })

        setCanvas(fabricCanvas);
        return () => fabricCanvas.dispose();
    }, []);


    useEffect(() => {
        if (canvas === null) return;

        canvas.on('object:modified', () => {
            const activeObject = canvas.getActiveObject();

            if (activeObject) {
                const x = parseFloat(activeObject.left.toFixed(2));
                const y = parseFloat(activeObject.top.toFixed(2));
                const scaleX = parseFloat(activeObject.scaleX.toFixed(2));
                const scaleY = parseFloat(activeObject.scaleY.toFixed(2));
                const angle = parseFloat(activeObject.angle.toFixed(2));

                setObjectValues({ x: x, y: y, scaleX: scaleX, scaleY: scaleY, rotateAngle: angle });
            }
        });

        return () => {
            canvas.off('object:modified');
        }
    }, [canvas, objectValues]);

    useEffect(() => {
        if (!canvas) return;
        const activeObject = canvas.getActiveObject();

        if (activeObject) {
            activeObject.set({
                left: objectValues.x, 
                top: objectValues.y, 
                scaleX: objectValues.scaleX, 
                scaleY: objectValues.scaleY, 
                angle: objectValues.rotateAngle
            })
            canvas.renderAll();
        }
    }, [canvas, objectValues]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown( copiedObject, setCopiedObject, canvas ));

        return () => { 
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [canvas, copiedObject]);

    return (
        <CanvasContext.Provider 
            value={{ 
                canvas, 
                canvasRef, 
                objectValues, 
                setObjectValues, 
            }}
        >
            { children }
        </CanvasContext.Provider>
    );
};


const ComContext = createContext(null);

export function useCom() {
    return useContext(ComContext);
}

export const CommunicationProvider = ({ children }) => {
    const [ response, setResponse ] = useState({ pageId: '', message: '' });
    const [ job, setJob ] = useState({ connecting: false, connected: false, started: false, paused: false });
    const [ progress, setProgress ] = useState({ uploading: false, converting: false, progress: 0 })
    const [ setupModal, setSetupModal ] = useState(false);
    const [ ws, setWs ] = useState(null);
    const [colors, setColors] = useState([
        { color: '#ff0000', name: 'Red', zValue: -9, command: "G6.1" },
        { color: '#ffa500', name: 'Orange', zValue: -9.8, command: "G6.6" },
        { color: '#000000', name: 'Black', zValue: -10.2, command: "G6.7" },
        { color: '#227fe3', name: 'Blue', zValue: -9.8, command: "G6.5" },
        { color: '#ffff00', name: 'Yellow', zValue: -9.5, command: "G6.3" },
        { color: '#008000', name: 'Green', zValue: -9.9, command: "G6.4" },
        { color: '#ffc0cb', name: 'Pink', zValue: -9.5, command: "G6.2" },
        { color: '#a52a2a', name: 'Brown', zValue: -9.5, command: "G6.8" },
    ]);
    const [ config, setConfig ] = useState({
        url: window.location.hostname,
        feedRate: 10000,
        jogSpeed: 12000,
        zOffset: 10,
        open: false
    });

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
            setJob({ connecting: true, connected: false, started: false })
                
            const socket = new WebSocket(`ws://${ config.url }:81`, ['arduino']);
            socket.binaryType = 'arraybuffer';
            setWs(socket)

        } catch (err) {
            setWs(null);
        }
    }, [config.url, ws])

    const closeSocket = useCallback(() => {
        setProgress({ uploading: false, converting: false, progress: 0 });
        setJob({ connecting: false, connected: false, started:  false});
        ws?.close();
        setWs(null);
    }, [ws])

    const sendToMachine = useCallback((gcode) => {
        const url = `http://${ config.url }/command?commandText=`;
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
            setJob({ connecting: false, connected: true, started: false });
            setTimeout(() => { setSetupModal(false) }, 3000);

            if (!window._keydownListenerAdded) {
                window.addEventListener('keydown', handleJog)
                window._keydownListenerAdded = true;
            }
        }

        const handleSocketMessage =  (message, gcode = null) => {
            console.log('Message :-> ', message);

            if (message.includes('/job.gcode job sent')) {
                console.log('The Indicator found');
                setJob({ connecting: false, connected: true, started: false });
            }

            setResponse(prev => ({
                ...prev,
                message: prev.message + message
            }));
    
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
            const text = new TextDecoder().decode(arrayBuffer);
            const [key, valueStr] = text.split(':', 2);
            if (!valueStr) return;
            const value = parseInt(valueStr.trim());
            // console.log(key, value);

            if(!isNaN(value)) {
                switch (true) {
                    case key === 'error' && value === 8:
                        handleSocketMessage('The Machine is in Alarm state \nChanging...\n', '$X');
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
            } else {
                handleSocketMessage(text);
            }
        }

        const handleText = (event) => {
            const [key, value] = event.data.split(':');

            if (key !== 'PING') {
                console.log(key, value);
                setResponse(prev => ({ 
                    ...prev, 
                    pageId: parseInt(value, 10), 
                    message: prev.message + event.data + "\n"
                }));
            }
        }

        const handleSocketClose = () => {
            setWs(null);
            setJob({ connected: false, connecting: false, started: false });
            setResponse(prev => ({ ...prev, message: prev.message + 'Socket Connection Closed ... \n' }));

            window.removeEventListener('keydown', handleJog);
        }

        const handleSocketError = (err) => {
            console.error('Socket error :-> ', err);
            setJob({ connected: false, connecting: false, started: false })
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
            }}
        >
            { children }
        </ComContext.Provider>
    )

}