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
    const [ job, setJob ] = useState({ connecting: false, connected: false, started: false });
    const [ progress, setProgress ] = useState({ uploading: false, converting: false, progress: 0 })
    const [ setupModal, setSetupModal ] = useState(false);
    const [ ws, setWs ] = useState(null);
    const [colors, setColors] = useState([
        { color: '#ff0000', name: 'Red', zValue: -22.5, command: "G6.1" },
        { color: '#ffa500', name: 'Orange', zValue: -22.5, command: "G6.2" },
        { color: '#000000', name: 'Black', zValue: -23, command: "G6.3" },
        { color: '#227fe3', name: 'Blue', zValue: -22.5, command: "G6.4" },
        { color: '#ffff00', name: 'Yellow', zValue: -22.5, command: "G6.5" },
        { color: '#008000', name: 'Green', zValue: -22.5, command: "G6.6" },
        { color: '#ffc0cb', name: 'Pink', zValue: -22.5, command: "G6.7" },
        { color: '#a52a2a', name: 'Brown', zValue: -22.5, command: "G6.8" },
    ]);
    const [ config, setConfig ] = useState({
        url: 'miniZund.local',
        feedRate: 10000,
        jogSpeed: 2000,
        zOffset: 10,
        open: false
    });

    const jogSpeedRef = useRef(config.jogSpeed);
    useEffect(() => {
        jogSpeedRef.current = config.jogSpeed;
    }, [ config.jogSpeed ])

    const openSocket = useCallback(() => {
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

    const sendToMachine = (gcode) => {
        const url = `http://${ config.url }/command?commandText=`;
        fetch(url + encodeURI(gcode) + `&PAGEID=${response.pageId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Http Error Status : ', response.status);
            }
        })
        .catch(err => {
            console.error('Fetch Error ->\n', err)
        })
    }

    const handleJog = (e) => {
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
    }


    useEffect(() => {
        if (!ws) return;

        ws.onopen = () => {
            setJob({ connecting: false, connected: true, started: false })
            setTimeout(() => { setSetupModal(false) }, 3000);

            if (!window._keydownListenerAdded) {
                window.addEventListener('keydown', handleJog)
                window._keydownListenerAdded = true;
            }
        }
        
        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                const reader = new FileReader();
                reader.onload = function() {
                    const text = reader.result;
                    setResponse(prev => ({ 
                        ...prev, 
                        message: prev.message + text
                    }));
                };
                reader.readAsText(event.data);
            } else if (event.data instanceof ArrayBuffer) {
                const arrayBuffer = event.data;
                const text = `${ new TextDecoder().decode(arrayBuffer) }`;
                let split_text = text.split(':', 2);

                if (split_text.length >1) {
                    split_text[1] = parseInt(split_text[1].trim())
                    if (!isNaN(split_text[1])) {
                        if (split_text[0] === 'error' && split_text[1] === 8) {
                            console.log('The Machine is in Alarm state \nChanging...')
                            sendToMachine('$X')

                        } else if (split_text[0] === 'ALARM' && split_text[1] === 1) {
                            console.log('Hard Limit Triggered \nRe-Homing...');
                            sendToMachine('$H')

                        }else if (split_text[0] === 'ALARM' && split_text[1] === 8) {
                            console.log('Soft Limit Triggered \nRe-Homing...')
                            sendToMachine('$X\nG1 X10Y10Z-10 F3000\n$H');
                        }
                    }
                }

                setResponse(prev => ({ 
                    ...prev, 
                    message: prev.message + text
                }));

            } else {
                const [key, value] = event.data.split(':');

                if (key !== 'PING') {
                    console.log('String :', key, ':  -> ', parseInt(value, 10));
                    
                    setResponse(prev => ({ 
                        ...prev, 
                        pageId: parseInt(value, 10), 
                        message: prev.message + event.data + "\n"
                    }));
                }
            }
        }

        ws.onclose = () => {
            setWs(null);
            setJob({ connected: false, connecting: false, started: false });
            setResponse(prev => ({ ...prev, message: prev.message + 'Socket Connection Closed ... \n' }));

            window.removeEventListener('keydown', handleJog);
        }

        ws.onerror = (err) => {
            console.error('Socket error -> ', err);
            setJob({ connected: false, connecting: false, started: false })
        }

    }, [job, ws])


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
                openSocket,
                progress, 
                setProgress,
                colors,
                setColors,
                config,
                setConfig
            }}
        >
            { children }
        </ComContext.Provider>
    )

}