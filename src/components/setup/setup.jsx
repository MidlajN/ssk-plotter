/* eslint-disable react/prop-types */

import { useEffect, useState } from "react";
import useCanvas from "../../context";
import { Files, ArrowUpNarrowWide, ArrowDownNarrowWide, Plus, Eye, EyeOff, Trash2, Settings2  } from "lucide-react";
import { SetupModal } from "./modal";
// import { deleteObject } from "../canvasFunctions";
import { deleteObject } from "../editor/functions";
import './setup.css'

export function Setup({ jobSetUp, setJobSetup }) {
    const { canvas } = useCanvas();
    const [rightClickEvent, setRightClickEvent] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [selected, setSelected] = useState(null);
    const [jobToUpdate, setJobToUpdate] = useState(null)
    
    
    useEffect(() => {
        if (!canvas) return;
        const handleRightClick = (event) => { 
            if (event.button === 3) setRightClickEvent(event); 
        }

        canvas.on('mouse:down', () => {

            canvas.getObjects().forEach((obj) => {
                obj.on('mousedown', handleRightClick);
                obj.set({
                    hasControls: false,
                    lockMovementX: true,
                    lockMovementY: true
                })
            })

            setRightClickEvent(null); 
        });

        return () => {
            canvas.off('mouse:down')
            canvas.getObjects().forEach((obj) => {
                obj.off('mousedown')
                obj.set({
                    hasControls: true,
                    lockMovementX: false,
                    lockMovementY: false
                })
            })
            canvas.renderAll();
        }
    },[])
     
    return (
        <>
            <div className="w-full h-full p-2">
                { rightClickEvent && <CustomComponent event={rightClickEvent} setEvent={setRightClickEvent} setModalOpen={setModalOpen} />}
                <div className="border-b-2 border-[#1c274c1c] py-1">
                    <h3>Machine Configuration</h3>
                </div>
                <div className="mt-4 h-[50%] bg-[#EBEBEB]">
                    <div className="w-full bg-[#081646ab] flex items-end justify-end gap-3 p-3">
                        <Plus 
                            size={20} 
                            strokeWidth={1.3} 
                            color={'#ffffff'} 
                            onClick={ () => { setModalOpen(true); }} />
                        <ArrowDownNarrowWide 
                            size={20} 
                            strokeWidth={1.3} 
                            color={'#ffffff'}
                            onClick={ () => {
                                const newSetup = [...jobSetUp];
                                const targetIndex = selected === newSetup.length - 1 ? 0 : selected + 1;

                                [newSetup[selected], newSetup[targetIndex]] = [newSetup[targetIndex], newSetup[selected]];
                                setJobSetup(newSetup);
                                setSelected(targetIndex)
                            }} />
                        <ArrowUpNarrowWide 
                            size={20} 
                            strokeWidth={1.3} 
                            color={'#ffffff'}
                            onClick={ () => {
                                const newSetup = [...jobSetUp];
                                const targetIndex = selected === 0? newSetup.length - 1  : selected - 1;

                                [newSetup[selected], newSetup[targetIndex]] = [newSetup[targetIndex], newSetup[selected]];
                                setJobSetup(newSetup);
                                setSelected(targetIndex);
                            }}
                        />
                        <Trash2 
                            size={20} 
                            strokeWidth={1.3} 
                            color={'#ffffff'}
                            onClick={ () => {
                                setJobSetup(jobSetUp.filter((item, i) => i !== selected));
                                setSelected(null);
                            }} />
                        <Files 
                            size={20} 
                            strokeWidth={1.3} 
                            color={'#ffffff'}
                            onClick={ () => {
                                const itemToCopy = jobSetUp.find((item, i) => i === selected);
                                if (itemToCopy) {
                                    const newSetup = [...jobSetUp];
                                    newSetup.splice(selected + 1, 0, itemToCopy);
                                    setJobSetup(newSetup);
                                }

                            }} />
                    </div>
                    <div>
                        { jobSetUp.map((item, index) => {
                            return (
                                <div key={index} className={ `flex justify-between items-end py-1 px-3 border-b border-b-[#1c274c28] ${ selected === index ? 'bg-[#d6d6d6ab]' : '' }` } onClick={() => setSelected(index)}>
                                    <p className="font-['MarryWeatherSansRegular'] text-[13px]">{ item.name }</p>
                                    <div className="flex gap-3 py-1">
                                        <Settings2 
                                            size={17} 
                                            strokeWidth={2} 
                                            cursor={'pointer'}
                                            onClick={ () => {
                                                setModalOpen(true);
                                                setJobToUpdate(item);
                                            }} 
                                            />
                                        { item.selected ? (
                                            <Eye 
                                                size={17} 
                                                strokeWidth={2} 
                                                cursor={'pointer'} 
                                                onClick={ () => {
                                                    setJobSetup((prevSetup) => prevSetup.map((item, i) => i === index ? {...item, selected: false} : item));

                                                    if (item.objects.get('type') === 'activeSelection') {
                                                        item.objects.forEachObject((obj) => {
                                                            obj.set({ stroke: 'transparent', hasControls: false, selectable: false })
                                                        })
                                                    } else {
                                                        item.objects.set({ stroke: 'transparent', hasControls: false, selectable: false })
                                                    }
                                                    canvas.discardActiveObject();
                                                    canvas.renderAll();
                                                }}
                                            />
                                        ) : (
                                            <EyeOff
                                                size={17} 
                                                strokeWidth={2} 
                                                cursor={'pointer'} 
                                                onClick={ () => {
                                                    setJobSetup((prevSetup) => prevSetup.map((item, i) => i === index ? {...item, selected: true} : item));

                                                    if (item.objects.get('type') === 'activeSelection') {
                                                        item.objects.forEachObject((obj) => {
                                                            obj.set({ stroke: item.type === 'thru-cut' ? 'red' : 'blue', hasControls: false, selectable: true })
                                                        })
                                                    } else {
                                                        item.objects.set({ stroke: item.type === 'thru-cut' ? 'red' : 'blue', hasControls: false, selectable: true })
                                                    }
                                                    canvas.discardActiveObject();
                                                    canvas.renderAll();
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>
            { modalOpen && 
                <SetupModal 
                    modalOpen={modalOpen} 
                    setModalOpen={setModalOpen}
                    jobSetUp={jobSetUp} 
                    setJobSetup={setJobSetup} 
                    setRightClickEvent={setRightClickEvent} 
                    jobToUpdate={jobToUpdate}
                    setJobToUpdate={setJobToUpdate}
                /> 
            }
        </>
    )
}
const CustomComponent = ({ event, setEvent, setModalOpen }) => {
    const { canvas } = useCanvas();

    const deleteElement = () => {
        deleteObject(canvas);
        setEvent(null);
    }

    // You can access event properties such as event.clientX, event.clientY here
    return (
        <div className="contextMenu" style={{ top: event.e.clientY - 80 , left: event.e.clientX }}>
            <ul>
                <li className="hover:bg-gray-100">
                    <Settings2 size={14} /> 
                    <button aria-haspopup="true" aria-controls="menu-lang" className="w-full text-left flex items-center outline-none focus:outline-none">
                        <span className="pr-1 flex-1">Change Function</span>
                        <span className="mr-auto">
                            <svg className="fill-current h-4 w-4 transition duration-150 ease-in-out" viewBox="0 0 20 20" >
                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                            </svg>
                        </span>
                    </button>

                    <ul id="menu-lang" aria-hidden="true" className="absolute top-0 right-0 transition duration-150 ease-in-out origin-top-left min-w-32">
                        <li className="px-3 py-1 hover:bg-gray-100" onClick={() => { setModalOpen(true) }}>Register Job</li>
                    </ul>
                </li>
                <li className="hover:bg-gray-100" onClick={deleteElement}><Trash2 size={14} /> Delete</li>
            </ul>
        </div>
    );
};
