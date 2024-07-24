/* eslint-disable react-refresh/only-export-components */
/* eslint-disable react/prop-types */
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { fabric } from "fabric";
import { handleKeyDown } from "./components/editor/functions";

const CanvasContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export default function useCanvas() {
    return useContext(CanvasContext);
}

export const CanvasProvider = ({ children }) => {
    const canvasRef = useRef(null);
    const [canvas, setCanvas ] = useState(null);
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
            width: fabric.util.parseUnit('85cm'),
            height: fabric.util.parseUnit('60cm'),
            backgroundColor: "white",
            fireRightClick: true,
            stopContextMenu: true,
        })

        setCanvas(fabricCanvas);
        return () => fabricCanvas.dispose();
    }, []);

    useEffect(() => {
        if (!canvas) return;
        canvas.on('mouse:move', () => {
            const activeObject = canvas.getActiveObject();

            if (activeObject) {
                const x = parseFloat(activeObject.left.toFixed(2));
                const y = parseFloat(activeObject.top.toFixed(2));
                const scaleX = parseFloat(activeObject.scaleX.toFixed(2));
                const scaleY = parseFloat(activeObject.scaleY.toFixed(2));
                const angle = parseFloat(activeObject.angle.toFixed(2));

                setObjectValues({ x: x, y: y, scaleX: scaleX, scaleY: scaleY, rotateAngle: angle });
            }
        })
    }, [canvas]);

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
            window.removeEventListener('keydown', handleKeyDown) 
        };
    }, [canvas, copiedObject]);

    return (
        <CanvasContext.Provider 
            value={{ 
                canvas, 
                canvasRef, 
                objectValues, 
                setObjectValues, 
                copiedObject, 
                setCopiedObject, 
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
    const [ response, setResponse ] = useState({ visible: false, message: '' });
    const [ job, setJob ] = useState({ connecting: false, connected: false, started: false });
    const [ progress, setProgress ] = useState({ uploading: false, converting: false, progress: 0 })
    const [ setupModal, setSetupModal ] = useState(false);
    const [ ws, setWs ] = useState(null);
    const [ machineUrl, port ] = [ 'localhost:3000', '5000'];
    // const [ machineUrl, port ] = [ '192.168.0.1', '81']
    // const machineUrl = 'localhost'
    // const port = '5000'
    // const machineUrl = '192.168.0.1'
    // const port = '192.168.0.1'


    const openSocket = useCallback(() => {
        if (ws !== null) return;
        try {
            setJob({ connecting: true, connected: false, started: false })
            // const socket = new WebSocket("ws://kochund.local:81", ['arduino']);
            setTimeout(() => {
                // setWs(new WebSocket(`ws://${machineUrl}:${port}`));
                setWs(new WebSocket(`ws://192.168.0.1:81`));
                // setWs(new WebSocket(`ws://localhost:5000`));
            }, 3000)

        } catch (err) {
            setWs(null);
        }
    }, [])


    useEffect(() => {
        if (!ws) return;
        ws.onopen = () => {
            
            // For Test
            const sendPing = () => {
                if (ws.readyState === WebSocket.OPEN) {
                    ws.send('Ping');
                    setTimeout(sendPing, 5000);
                }
            };
            sendPing();

            setJob({ connecting: false, connected: true, started: false })

            setTimeout(() => {
                setSetupModal(false);
            }, 3000);
        }
        
        ws.onmessage = (event) => {
            if (event.data instanceof Blob) {
                console.log('Blob ', event.data)
                const reader = new FileReader();
                reader.onload = function() {
                    const text = reader.result;
                    console.log('Blob as Text: ', text);
                    setResponse(prev => ({ 
                        ...prev, 
                        line: prev.line + 1, 
                        message: prev.message + text + "\n"
                    }));
                };
                reader.readAsText(event.data);
            } else if (event.data instanceof ArrayBuffer) {
                const arrayBuffer = event.data;
                const text = `Response  ->  ${ new TextDecoder().decode(arrayBuffer) }\n`;
                setResponse(prev => ({ 
                    ...prev, 
                    line: prev.line + 1, 
                    message: prev.message + text + "\n"
                }));

            } else {
                // console.log('Response :', event)
                setResponse(prev => ({ 
                    ...prev, 
                    line: prev.line + 1, 
                    message: prev.message + event.data + "\n"
                }));
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
                machineUrl,
                port,
                setupModal, 
                setSetupModal,
                openSocket,
                progress, 
                setProgress
            }}
        >
            { children }
        </ComContext.Provider>
    )

}