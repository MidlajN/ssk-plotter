/* eslint-disable react/prop-types */
import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import useCanvas from "../../context/CanvasContext";
import useCom from "../../context/ComContext";
import { SetupModal } from "./Modal";
import { motion } from "framer-motion";
import './plotter.css'
import { RotateLeft, RotateRight } from "./Icons";
import { Group } from "fabric";
import { DimensionComponent, SettingsComponent, StatusComponent, ColorSortComponent, ActionButtonsComponent } from "./Components";

export const Plot = ({ plotCanvas }) => {
    const { canvas } = useCanvas();
    const { setupModal } = useCom();
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