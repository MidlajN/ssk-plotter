/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import useCanvas from "../../context/CanvasContext";
import useCom from "../../context/ComContext";
import { SetupModal } from "./Modal";
import { motion } from "framer-motion";
import './plotter.css'
import { RotateLeft, RotateRight } from "./Icons";
import { Group, Path } from "fabric";
import { DimensionComponent, SettingsComponent, StatusComponent, ColorSortComponent, ActionButtonsComponent } from "./Components";

export const Plot = ({ plotCanvas }) => {
    const { canvas } = useCanvas();
    const { setupModal, response, sendToMachine, dotRef, job } = useCom();
    const [ openConfig, setOpenConfig ] = useState(false)

    useEffect(() => {
        canvas.selection = false;
        canvas.discardActiveObject();
        canvas.getObjects().forEach((obj) => obj.set({ selectable: false }));
        canvas.requestRenderAll();

        return () => {
            canvas.selection = true;
            canvas.getObjects().forEach(obj => {
                if (obj.name !== 'ToolHead' && obj.name !== 'BedSize') {
                    obj.set({ selectable: true })
                }
            });
        };
    }, [canvas]);

    useEffect(() => {
        if (!plotCanvas) return
        if ( response.pageId === '' && !job.connected ) return;
        sendToMachine('$Report/interval=50');

        dotRef.current = new Path('M50 25L33.0449 23.598L29 21L26.6495 17.4012L25 0L23.5202 17.4012L21 21L16.9526 23.598L0 25L16.9526 26.7276L21 29.5L23.5203 33.5116L25 50L26.6495 33.4929L29 29.5L33.0449 26.7276L50 25Z', {
            fill: '#223265de',
            originX: 'center',
            originY: 'center',
            lockMovementX: true,
            lockMovementY: true,
            lockScalingX: true,
            lockScalingY: true,
            lockRotation: true,
            top: 310 * 96 / 25.4,
            left: 430 * 96 / 25.4,
            name: 'ToolHead',
            selectable: false,
            hoverCursor: 'auto'
        });

        let snapped = false;

        plotCanvas.on('object:moving', (e) => {

            const movingObject = e.target;
            const [ mTopLeft, mTopRight, mBottomRight, mBottomLeft ] = movingObject.getCoords();
            const dotCenter = dotRef.current.getCenterPoint();

            const calculateDist = (point, centerX, centerY) => {
                const dx = point.x - centerX;
                const dy = point.y - centerY;
                return Math.sqrt(dx * dx + dy * dy);
            }

            const topLeftDistance = calculateDist(mTopLeft, dotCenter.x, dotCenter.y);
            const topRightDistance = calculateDist(mTopRight, dotCenter.x, dotCenter.y);
            const bottomLeftDistance = calculateDist(mBottomLeft, dotCenter.x, dotCenter.y);
            const bottomRightDistance = calculateDist(mBottomRight, dotCenter.x, dotCenter.y);

            const shortestDistance = Math.min(topLeftDistance, topRightDistance, bottomLeftDistance, bottomRightDistance);

            if (!snapped && shortestDistance < 80) {
                const horizontalD = mTopRight.x - mTopLeft.x;
                const verticalD = mBottomLeft.y - mTopLeft.y;

                if (shortestDistance === topLeftDistance) {
                    movingObject.set({
                        left: dotCenter.x,
                        top: dotCenter.y
                    })
                }
                else if (shortestDistance === topRightDistance) {
                    movingObject.set({
                        left: dotCenter.x - horizontalD,
                        top: dotCenter.y
                    })
                }
                else if (shortestDistance === bottomLeftDistance){
                    movingObject.set({
                        left: dotCenter.x,
                        top: dotCenter.y - verticalD
                    })
                }
                else if (shortestDistance === bottomRightDistance) {
                    movingObject.set({
                        left: dotCenter.x - horizontalD,
                        top: dotCenter.y - verticalD
                    })
                }  
                movingObject.setCoords();
                setTimeout(() => { snapped = true }, 500)
            } else {
                setTimeout(() => { snapped = false }, 500)
            }
        });


        plotCanvas.add(dotRef.current);
        plotCanvas.renderAll();
        return () => {
            plotCanvas.remove(dotRef.current);    
        }
    }, [ response.pageId, job.connected, plotCanvas ])

    const handleRotation = (angle) => {
        const activeObjects = plotCanvas.getActiveObjects()
        const group = new Group(activeObjects)
        plotCanvas.remove(...activeObjects)
        group.rotate(angle)
        plotCanvas.add(...group.removeAll());
        plotCanvas.renderAll();
    }

    return (
        <>
            <div className="flex justify-between gap-4 max-[750px]:flex-col lg:flex-col p-5 z-[2] bg-white h-full pb-10">
                <div>
                    <motion.div
                        key={1}
                        initial={{ scale: 0.8, opacity: 0, translateY: 40 }}
                        animate={{ scale: 1, opacity: 1, translateY: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                    >
                        <DimensionComponent plotCanvas={plotCanvas} />
                    </motion.div>
                    <motion.div
                        key={2}
                        initial={{ scale: 0.8, opacity: 0, translateY: 40 }}
                        animate={{ scale: 1, opacity: 1, translateY: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="mx-3 px-1 py-1 flex bg-gray-100 rounded-xl items-center">
                            <div 
                                className="hover:bg-gray-200 active:bg-gray-300 p-2 rounded-xl cursor-pointer transition-all duration-300"
                                onClick={() => handleRotation(90)}
                            >
                                <RotateRight width={25} height={25} />
                            </div>
                            <div 
                                className="hover:bg-gray-200 active:bg-gray-300 p-2 rounded-xl cursor-pointer transition-all duration-300"
                                onClick={() => handleRotation(-90)}
                            >
                                <RotateLeft width={25} height={25} />
                            </div>
                            <div 
                                className="hover:bg-gray-200 active:bg-gray-300 p-2 rounded-xl cursor-pointer transition-all duration-300 ml-auto" 
                                onClick={ () => setOpenConfig(true) }
                            >
                                <Settings size={22} strokeWidth={1.5} />
                            </div>
                        </div>
                    </motion.div>

                    <SettingsComponent openConfig={openConfig} setOpenConfig={setOpenConfig} plotCanvas={plotCanvas} />

                    <motion.div
                        key={3}
                        initial={{ scale: 0.8, opacity: 0, translateY: 40 }}
                        animate={{ scale: 1, opacity: 1, translateY: 0 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        <StatusComponent />
                    </motion.div>

                    <motion.div
                        key={4}
                        initial={{ opacity: 0,  }}
                        animate={{ opacity: 1,  }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                    >
                        <ColorSortComponent />
                    </motion.div>
                </div>

                <motion.div
                    key={5}
                    initial={{ scale: 0.8, opacity: 0, translateY: 40 }}
                    animate={{ scale: 1, opacity: 1, translateY: 0 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <ActionButtonsComponent canvas={plotCanvas} />
                </motion.div>

                { setupModal && <SetupModal /> }

            </div>
        </>
    )
}