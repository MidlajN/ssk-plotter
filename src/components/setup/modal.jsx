/* eslint-disable no-undef */
/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import {  X, ChevronsDown  } from "lucide-react";
import useCanvas from "../../context";

import ReactModal from "react-modal";
ReactModal.setAppElement('#root');


export const SetupModal = ({modalOpen, setModalOpen, jobSetUp, setJobSetup, setRightClickEvent , jobToUpdate, setJobToUpdate}) => {
    const [ selected, setSelected ] = useState('thru-cut');
    const { canvas } = useCanvas();
    const [ thruCutData, setThruCutData ] = useState({
        name: 1,
        properties : {
            materialThickness: 0.5,
            zOffset: 0.1,
            zLowering: 300,
            zLowered: 500
        }
    })
    const [ routerData, setRouterData ] = useState({
        name: 1,
        properties: {
            materialThickness: 0.5,
            clearingDist: 2,
            maxPassDepth: 2,
            lastPassDepth: 0.6,
            routerSpeed: 1200,
            offset: 'inside',
            zLowering: 200,
            zLowered: 400,
            toolDia: 0.3
        }
    })
    const [ creaseData, setCreaseData ] = useState({
        name: 1,
        properties : {
            materialThickness: 0.5,
            penetration: 30,
            zLowering: 300,
            zLowered: 500
        }
    })

    useEffect(() => {
        console.log('jobToUpdate', jobToUpdate)
        if (jobToUpdate) {
            setSelected(jobToUpdate.type);
            if (jobToUpdate.type === 'thru-cut') {
                setThruCutData({name: jobToUpdate.name, properties: jobToUpdate.properties});
            } else if (jobToUpdate.type === 'router') {
                setRouterData({name: jobToUpdate.name, properties: jobToUpdate.properties});
            }
        }
    },[jobToUpdate])

    const handleChange = (mode, event) => {
        if (mode === 'thru-cut') {
            if (event.target.name === 'name') {
                setThruCutData((prev) => ({ ...prev, name: event.target.value }));
            } else {
                setThruCutData((prev) => ({ ...prev, properties: { ...prev.properties, [event.target.name] : event.target.value } }));
            }

        } else if (mode === 'router') {
            if (event.target.name === 'name') {
                setRouterData((prev) => ({ ...prev, name: event.target.value }));
            } else {
                setRouterData((prev) => ({ ...prev, properties: { ...prev.properties, [event.target.name] : event.target.value } }));
            }
        } else if (mode === 'crease') {
            if (event.target.name === 'name') {
                setCreaseData((prev) => ({ ...prev, name: event.target.value }));
            } else {
                setCreaseData((prev) => ({ ...prev, properties: { ...prev.properties, [event.target.name] : event.target.value } }));
            }
        }
    }

    const applySetup = () => {
        const activeObject = canvas.getActiveObject();
        console.log('applySetup', jobToUpdate)
        if (!activeObject && !jobToUpdate) return;

        if (activeObject) {
            if (activeObject.get('type') === 'activeSelection') {
                activeObject.forEachObject((obj) => {
                    obj.set({
                        stroke: selected === 'thru-cut' || selected === 'crease' ? selected === 'thru-cut' ? '#ff0000' : '#00ff00' : '#0000ff',
                    })
                });
            } else {
                activeObject.set({
                    stroke: selected === 'thru-cut' || selected === 'crease' ? selected === 'thru-cut' ? '#ff0000' : '#00ff00' : '#0000ff',
                })
            }
        }
        canvas.discardActiveObject()
        canvas.requestRenderAll();
        const setup = {
            name: selected === 'thru-cut' || selected === 'crease' ? selected === 'thru-cut' ? `Thru-Cut ${thruCutData.name}` : `Crease ${creaseData.name}` : `Router ${routerData.name}`,
            type: selected === 'thru-cut' || selected === 'crease' ? selected === 'thru-cut' ? 'thru-cut' : 'crease' : 'router',
            objects: activeObject,
            properties: selected === 'thru-cut' || selected === 'crease' ? selected === 'thru-cut' ? thruCutData.properties : creaseData.properties : routerData.properties, 
            selected: true
        }
        
        if (jobToUpdate) {
            console.log('jobToUpdate', jobSetUp)
            const index = jobSetUp.findIndex((job) => job.name === jobToUpdate.name);
            jobSetUp[index] = setup;
            setJobSetup([...jobSetUp]);
            setJobToUpdate(null);
        } else {
            setJobSetup((prevSetup) => [...prevSetup, setup]);
        }
        setRightClickEvent(null);
        setModalOpen(false);
    }

    
    const thruCut = () => {
        return (
            <div>
                <div className="flex items-end justify-between mb-4">
                    <p className="text-sm">Material Thickness : </p>
                    <div className="flex gap-1 w-[50%]">
                        <input 
                            type="text"
                            name="materialThickness"
                            className="w-full outline-none text-end px-2 text-xs" 
                            value={ thruCutData.properties.materialThickness } 
                            onChange={ (e) => handleChange('thru-cut', e) }
                        />
                        <p>mm</p>
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <p className="text-sm">Z Offset : </p>
                    <div className="flex gap-1 w-[50%]">
                        <input 
                            type="text" 
                            name="zOffset"
                            className="w-full outline-none text-end px-2 text-xs"
                            value={ thruCutData.properties.zOffset }
                            onChange={ (e) => handleChange('thru-cut', e) }
                        />
                        <p>mm</p>
                    </div>
                </div>
            </div>
        )
    }

    const crease = () => {
        return (
            <div>
                <div className="flex items-end justify-between mb-4">
                    <p className="text-sm">Material Thickness : </p>
                    <div className="flex gap-1 w-[50%]">
                        <input 
                            type="text"
                            name="materialThickness"
                            className="w-full outline-none text-end px-2 text-xs" 
                            value={ creaseData.properties.materialThickness } 
                            onChange={ (e) => handleChange('crease', e) }
                        />
                        <p>mm</p>
                    </div>
                </div>
                <div className="flex items-end justify-between">
                    <p className="text-sm">Percentage of Penetration : </p>
                    <div className="flex gap-1 w-[50%]">
                        <input 
                            type="text" 
                            name="penetration"
                            className="w-full outline-none text-end px-2 text-xs"
                            value={ creaseData.properties.penetration }
                            onChange={ (e) => handleChange('crease', e) }
                        />
                        <p> % &nbsp;&nbsp;</p>
                    </div>
                </div>
            </div>
        )
    }


    const router = () => {
        return (
            <div>
                <div className="flex items-end justify-between gap-12 mb-4">
                    <p className="text-sm">Material Thickness : </p>
                    <div className="flex gap-1 w-[40%]">
                        <input 
                            type="text" 
                            name="materialThickness"
                            className="w-full outline-none text-end px-2 text-xs"  
                            value={ routerData.properties.materialThickness }
                            onChange={ (e) => handleChange('router', e) }
                        />
                        <p>mm</p>
                    </div>
                </div>
                <div className="flex items-end justify-between gap-8 mb-4">
                    <p className="text-sm">Tool Diameter : </p>
                    <div className="flex gap-1 w-[40%]">
                        <input 
                            type="text"
                            name="toolDia"
                            className="w-full outline-none text-end px-2 text-xs"  
                            value={ routerData.properties.toolDia }
                            onChange={ (e) => handleChange('router', e) }
                        />
                        <p>mm</p>
                    </div>
                </div>
                <div className="flex items-end justify-between gap-8 mb-4">
                    <p className="text-sm">Clearing Distance : </p>
                    <div className="flex gap-1 w-[40%]">
                        <input 
                            type="text"
                            name="clearingDist"
                            className="w-full outline-none text-end px-2 text-xs"  
                            value={ routerData.properties.clearingDist }
                            onChange={ (e) => handleChange('router', e) }
                        />
                        <p>mm</p>
                    </div>
                </div>
                <div className="flex items-end justify-between gap-8 mb-4">
                    <p className="text-sm">Maximum Depth in Multipass : </p>
                    <div className="flex gap-1 w-[40%]">
                        <input 
                            type="text" 
                            name="maxPassDepth"
                            className="w-full outline-none text-end px-2 text-xs"  
                            value={ routerData.properties.maxPassDepth }
                            onChange={ (e) => handleChange('router', e) }
                        />
                        <p>mm</p>
                    </div>
                </div>
                <div className="flex items-end justify-between gap-8 mb-4">
                    <p className="text-sm">Multipass Last Pass Depth : </p>
                    <div className="flex gap-1 w-[40%]">
                        <input 
                            type="text" 
                            name="lastPassDepth"
                            className="w-full outline-none text-end px-2 text-xs"  
                            value={ routerData.properties.lastPassDepth }
                            onChange={ (e) => handleChange('router', e) }
                        />
                        <p>mm</p>
                    </div>
                </div>
                <div className="flex justify-between">
                    <div className="flex items-end justify-between gap-2 mb-4">
                        <p className="text-sm">Router Speed : </p>
                        <div className="flex gap-1 w-full">
                            <input 
                                type="text" 
                                name="routerSpeed"
                                className="w-full outline-none text-end px-2 text-xs"  
                                value={ routerData.properties.routerSpeed }
                                onChange={ (e) => handleChange('router', e) }
                            />
                            <p>rpm</p>
                        </div>
                    </div>
                    <div className="flex items-end justify-between gap-1 mb-4 w-[40%]">
                        <p className="text-sm">Offset Side: </p>
                        <select
                            name="offset" 
                            className="w-full outline-none border-bg-gray-300 min-w-[7rem]" 
                            value={ routerData.properties.offset }
                            onChange={ (e) => handleChange('router', e) }
                        >
                            <option value="outside">Outside</option>
                            <option value="inside">Inside</option>
                        </select>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <ReactModal 
            isOpen={modalOpen} 
            style={{ 
                overlay: { 
                    width: 'fit-content',
                    height: 'fit-content', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                }, 
                content: { 
                    // width: 'fit-content', 
                    height: 'fit-content', 
                    top: '50%', 
                    left: '50%', 
                    transform: 'translate(-50%, -50%)',
                    padding: '0px',
                    border: 'none',
                    width: '50rem',
                    borderRadius: 'none',
                    background: 'transparent'
                } 
            }}>
            <div className="setupModal" >
                <div className="header">
                    <p>Machine Setup</p>
                    <button className="bg-[#ff4c4c] hover:bg-[#ec2929]">
                        <X size={18} strokeWidth={2} color={'#ffffff'} onClick={ () => { setModalOpen(false) } } />
                    </button>
                </div>
                <div className="content" >
                    <div className="select">
                        <p>Choose Method : </p>
                        <div className="options">
                            <select className="w-full" onChange={(e) => setSelected(e.target.value)}>
                                <option value="thru-cut">Thru-Cut</option>
                                <option value="router">Router</option>
                                <option value="crease">Crease</option>
                            </select>
                            <div><ChevronsDown size={18} /></div>
                        </div>
                    </div>  
                    <div className="name">
                        <p>Name : </p>
                        <input 
                            type="text" 
                            name="name"
                            value={ selected === 'thru-cut' || selected === 'crease' ? selected === 'thru-cut' ? thruCutData.name : creaseData.name : routerData.name } 
                            onChange={ (e) => handleChange(selected, e) }
                        />
                    </div>

                    <div className="bg-[#e2e2e2] p-4 w-full min-h-[15rem]">
                        { selected === 'thru-cut' && thruCut() }
                        { selected === 'router' && router() }
                        { selected === 'crease' && crease() }
                    </div>

                    <div className="mt-6 px-3 py-2">
                        <div className="flex items-end justify-between">
                            <p className="text-[13px]">Tool Lowered Speed : &nbsp;</p>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    name="zLowered"
                                    className="w-full outline-none text-end px-2 text-xs" 
                                    value={ selected === 'thru-cut' || selected === 'crease' ? selected === 'thru-cut' ? thruCutData.properties.zLowered : creaseData.properties.zLowered : routerData.properties.zLowered }
                                    onChange={ (e) => handleChange(selected, e) }
                                />
                                <p>mm/s</p>
                            </div>
                        </div>
                        <div className="flex items-end justify-between mt-3">
                            <p className="text-[13px]">Tool Lowering Speed : &nbsp;</p>
                            <div className="flex gap-2">
                                <input 
                                    type="text"
                                    name="zLowering"
                                    className="w-full outline-none text-end px-2 text-xs"
                                    value={ selected === 'thru-cut' || selected === 'crease' ? selected === 'thru-cut' ? thruCutData.properties.zLowering : creaseData.properties.zLowering : routerData.properties.zLowering }
                                    onChange={ (e) => handleChange(selected, e) }
                                />
                                <p>mm/s</p>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end gap-4 mt-10">
                        <button 
                            className="transition-all duration-300 bg-[#2a365c] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                            onClick={ applySetup }>Apply</button>
                        <button 
                            className="transition-all duration-300 bg-[#23325cbb] hover:bg-[#1C274C] px-8 py-[2px] text-white"
                            onClick={ () => { setModalOpen(false) } }
                        > Cancel
                        </button>
                    </div>
                </div>
            </div>
        </ReactModal>
    )
}
