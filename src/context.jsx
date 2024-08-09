/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import { handleKeyDown } from "./components/editor/functions";
import 'fabric-history'

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
            width: fabric.util.parseUnit('73cm'),
            height: fabric.util.parseUnit('53cm'),
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
    // const [ machineUrl, port ] = [ '192.168.0.1', '81'];
    const [ config, setConfig ] = useState({
        url: '192.168.0.1',
        feedRate: 12000,
        seekRate: 10000,
        zOffset: 5
    })
    const [colors, setColors] = useState([
        { color: '#ff0000', name: 'Red', zValue: 17.9, command: "G6.7" },
        { color: '#0000ff', name: 'Blue', zValue: 19.2, command: "G6.8" },
        { color: '#008000', name: 'Green', zValue: 19.4, command: "G6.4" },
        { color: '#ffff00', name: 'Yellow', zValue: 18, command: "G6.1" },
        { color: '#ffa500', name: 'Orange', zValue: 19.4, command: "G6.2" },
        { color: '#800080', name: 'Purple', zValue: 19.4, command: "G6.6" },
        { color: '#000000', name: 'Black', zValue: 14, command: "G6.5" },
        { color: '#ffc0cb', name: 'Pink', zValue: 19.2, command: "G6.3" },
    ])

    const openSocket = useCallback(() => {
        if (ws !== null) return;
        try {
            setJob({ connecting: true, connected: false, started: false })
            setTimeout(() => {
                
                const socket = new WebSocket(`ws://192.168.0.1:81`, ['arduino']);
                socket.binaryType = 'arraybuffer';
                setWs(socket)

            }, 3000)

        } catch (err) {
            setWs(null);
        }
    }, [])


    useEffect(() => {
        if (!ws) return;

        ws.onopen = () => {

            setJob({ connecting: false, connected: true, started: false })

            setTimeout(() => {
                setSetupModal(false);
            }, 3000);
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
                        const url = `http://${ config.url }/command?commandText=`;

                        if (split_text[0] === 'error' && split_text[1] === 8) {
                            console.log('The Machine is in Alarm state, \nChanging...')
                            fetch(url + encodeURI('$X') + `&PAGEID=${response.pageId}`)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error('HTTP ERROR! STATUS : ' + response.status);
                                }
                            })
                            .catch(err => {
                                console.log('Fetch Error ', err)
                            })
                        } else if (split_text[0] === 'ALARM' && split_text[1] === 1) {
                            console.log('Hard Limit Triggered \nRestartng...');

                            fetch(url + encodeURI('[ESP444]RESTART') + `&PAGEID=${response.pageId}`)
                            // fetch(url + encodeURI('$X\n$X\nG1 X10Y10Z10 F3000\n$H') + `&PAGEID=${response.pageId}`)
                            .then(response => {
                                if (response.ok){
                                    ws.close()
                                } else {
                                    throw new Error('HTTP ERROR! STATUS : ' + response.status);
                                }
                            })
                            .catch(err => {
                                console.log('Restart Error ', err)
                            })
                        }else if (split_text[0] === 'ALARM' && split_text[1] === 8) {
                            console.log('Homing Failed \nRe-homing...');

                            fetch(url + encodeURI('$X\nG1 X10Y10Z10 F3000\n$H') + `&PAGEID=${response.pageId}`)
                            .then(response => {
                                if (response.ok){
                                    // ws.close()
                                    console.log('Connection Established')
                                } else {
                                    throw new Error('HTTP ERROR! STATUS : ' + response.status);
                                }
                            })
                            .catch(err => {
                                console.log('Restart Error ', err)
                            })
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
                    console.log('String ;', key, ':  -> ', parseInt(value, 10));
                    
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

            setResponse(prev => ({ 
                ...prev, 
                line: prev.line + 1, 
                message: prev.message + 'Socket Connection Closed ... \n'
            }));
        }

        ws.onerror = (err) => {
            console.log('Socket error -> ', err);
            setJob({ connected: false, connecting: false, started: false })
        }

        return () => {
            // console.log('Socket Check : ', job)
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