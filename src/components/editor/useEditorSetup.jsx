/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { Line, PencilBrush } from "fabric";
import { prebuiltComponents } from "./components.jsx";
import { PenTool, Pencil } from "lucide-react";
import { componentToUrl } from "./functions.jsx";

export const useEditorSetup = (canvas, tool, strokeColor, element, saveState, toolRef) => {

    useEffect(() => {
      if (!canvas) return;
  
      canvas.mode = tool;
      toolRef.current = tool;
  
      const resetCanvas = () => {
        canvas.selection = true;
        canvas.hoverCursor = 'all-scroll';
        canvas.defaultCursor = 'auto';
  
        canvas.getObjects().forEach(obj => {
          if (obj.name !== 'ToolHead' && obj.name !== 'BedSize' ) {
            obj.set({
              selectable: true
            })
          }
        });
  
        canvas.off('mouse:down');
        canvas.off('mouse:move');
        canvas.off('mouse:up');
      }
  
      const commonSetup = (cursor = 'auto') => {
        canvas.selection = false;
        canvas.hoverCursor = cursor;
        canvas.getObjects().forEach(obj => {
          obj.set({
            selectable: false
          })
        });
      }
  
      if (tool === 'Pen') {
        console.log('strokeColor : ', strokeColor)
        canvas.isDrawingMode = true;
        canvas.freeDrawingBrush = new PencilBrush(canvas);
        canvas.freeDrawingBrush.color = strokeColor;
        canvas.freeDrawingBrush.width = 3;
  
        const customCursor = componentToUrl(PenTool, 0);
        canvas.freeDrawingCursor = `url(${ customCursor }), auto`;
  
        return () => { 
          canvas.isDrawingMode = false; 
        };
      }
  
      if (tool === 'Lines') {
        const customCursor = componentToUrl(Pencil, 90);
        canvas.defaultCursor = `url(${ customCursor }), auto`;
        commonSetup(`url(${ customCursor }), auto`);
  
        let line;
        let mouseDown = false;
  
        canvas.on('mouse:down', (event) => {
          canvas.off('object:added', saveState)
          const pointer = canvas.getPointer(event.e);
  
          if (!mouseDown) {
            mouseDown = true;
            line = new Line([pointer.x, pointer.y, pointer.x, pointer.y], {
              id: 'added-line',
              stroke: strokeColor,
              strokeWidth: 3,
              selectable: false
            })
            canvas.add(line);
            canvas.requestRenderAll();
          }
        });
  
        canvas.on('mouse:move', (event) => {
          const isCtrlPressed = event.e.ctrlKey;
  
          if (mouseDown) {
            const pointer = canvas.getPointer(event.e);
            if (isCtrlPressed) {
              if (pointer.x < line.x1 + 100 && pointer.x > line.x1 - 100 && line.height >  100 ) pointer.x = line.x1;
              if (pointer.y < line.y1 + 100 && pointer.y > line.y1 - 100  && line.width >  100) pointer.y = line.y1
            }
            line.set({ x2: pointer.x , y2: pointer.y });
            canvas.requestRenderAll();
          }
        });
  
        canvas.on('mouse:up', () => {
          line.setCoords();
          mouseDown = false;
          canvas.on('object:added', saveState)
          canvas.fire('object:modified', { target: line });
        });
  
        return resetCanvas;
      }
  
      if (tool === 'Elements') {
        commonSetup();
        let object;
        let mouseDown = false;
        let startPointer;
  
        canvas.on('mouse:down', (event) => {
          canvas.off('object:added', saveState)
          mouseDown = true;
          startPointer = canvas.getPointer(event.e);
  
          object = new prebuiltComponents[element].constructor({
            ...prebuiltComponents[element].toObject(),
            left: startPointer.x,
            top: startPointer.y,
            selectable: false,
            stroke: strokeColor
          });
  
          canvas.add(object);
        })
  
        canvas.on('mouse:move', (event) => {
          if (mouseDown && object) {
            const pointer = canvas.getPointer(event.e);
            const width = Math.abs(pointer.x - startPointer.x);
            const height = Math.abs(pointer.y - startPointer.y);
  
            if (object.type === 'rect' || object.type === 'triangle') {
              object.set({ width: width, height: height });
              if (pointer.x < startPointer.x) object.set({ left: pointer.x });
              if (pointer.y < startPointer.y) object.set({ top: pointer.y });
            } else if (object.type === 'ellipse') {
              object.set({ rx: width / 2, ry: height / 2 });
              if (pointer.x < startPointer.x) object.set({ left: pointer.x });
              if (pointer.y < startPointer.y) object.set({ top: pointer.y });
            }
            canvas.requestRenderAll();
          }
        });
  
        canvas.on('mouse:up', () => {
          canvas.on('object:added', saveState)
          object.setCoords();
          mouseDown = false;
          canvas.fire('object:modified', { target: object });
        });
  
        return resetCanvas;
      }
    }, [canvas, element, saveState, strokeColor, tool])
  }
  