/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect } from "react";
import { Line, PencilBrush, Rect, Ellipse, Triangle, IText } from "fabric";
import { PenTool, Pencil } from "lucide-react";
import ReactDOMServer from 'react-dom/server'
import useCanvas from "../../context/CanvasContext";
import useCom from "../../context/ComContext";

export const useEditorSetup = (tool, strokeColor, element) => {
  const { canvas, saveState, toolRef } = useCanvas()
  const { colors } = useCom();

  const componentToUrl = (Component, rotationAngle = 0) => {
      let svgString = ReactDOMServer.renderToStaticMarkup(<Component size={20} strokeWidth={1.5} color={'#4b5563'}  />)
      svgString = svgString.replace(
          '<svg ',
          `<svg transform="rotate(${rotationAngle})" `
        );

      const blob = new Blob([svgString], { type: 'image/svg+xml'});
      const url = URL.createObjectURL(blob);

      return url
  }

  useEffect(() => {
    if (!canvas) return;

    canvas.mode = tool;
    toolRef.current = tool;

    const resetCanvas = (downFunction, moveFunction, upFunction) => {
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

      canvas.off('mouse:down', downFunction);
      canvas.off('mouse:move', moveFunction);
      canvas.off('mouse:up', upFunction);
    }

    const commonSetup = (cursor = 'auto') => {
      canvas.discardActiveObject();
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

      canvas.on('path:created', (e) => {
        e.path.isFreeDraw = true;
      })

      return () => { 
        canvas.isDrawingMode = false; 
        canvas.off('path:created');
      };
    }

    if (tool === 'Lines') {
      const customCursor = componentToUrl(Pencil, 90);
      canvas.defaultCursor = `url(${ customCursor }), auto`;
      commonSetup(`url(${ customCursor }), auto`);

      let line;
      let mouseDown = false;

      const setPointer = (event) => {
        canvas.off('object:added', saveState);
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
      }

      const drawLine = (event) => {
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
      }

      const finishLine = () => {
        line.setCoords();
        mouseDown = false;
        canvas.on('object:added', saveState);
        canvas.fire('object:modified', { target: line });
      }

      canvas.on('mouse:down', setPointer);  
      canvas.on('mouse:move', drawLine);
      canvas.on('mouse:up', finishLine);

      return () => resetCanvas(setPointer, drawLine, finishLine);
    }

    if (tool === 'Elements') {
      commonSetup();
      const prebuiltComponents = {
        rectangle: new Rect({
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: 'black',
          strokeWidth: 3,
        }),
        circle: new Ellipse({
          rx: 0,
          ry: 0,
          fill: 'transparent',
          stroke: 'black',
          strokeWidth:3,
        }),
        triangle: new Triangle({
          width: 0,
          height: 0,
          fill: 'transparent',
          stroke: 'black',
          strokeWidth: 3,
        }),
      };
      
      let object;
      let mouseDown = false;
      let startPointer;

      const setUpElement = (event) => {
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
      }

      const drawElement = (event) => {
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
      }

      const finishElement = () => {
        canvas.on('object:added', saveState)
        object.setCoords();
        mouseDown = false;
        canvas.fire('object:modified', { target: object });
      }

      canvas.on('mouse:down', setUpElement);
      canvas.on('mouse:move', drawElement);
      canvas.on('mouse:up', finishElement)


      return () => resetCanvas(setUpElement, drawElement, finishElement);
    }

    if (tool === 'Text') {
      canvas.selection = false;

      const loadFont = async (fontName) => {
        try {
          await document.fonts.load(`1em ${fontName}`);
          console.log(`${fontName} is loaded`);
        } catch (error) {
          console.error(`Error loading font: ${fontName}`, error)
        }
      }

      const addText = async (event) => {
        const pointer = canvas.getPointer(event.e);
        const isIntersecting = canvas.getObjects().some((obj) => {
          if (obj.type === 'i-text') { 
            return obj.containsPoint(pointer); 
          }
          return false;
        });
        if (isIntersecting) return;

        const fontName = 'OpenSans';
        await loadFont(fontName)
        const text = new IText('Enter Text Here', {
          left: pointer.x,
          top: pointer.y,
          stroke: colors[0].color,
          strokeWidth: 0.5,
          fill: 'transparent',
          fontFamily: fontName,
          fontSize: 20,
          padding: 0,
        })
        canvas.add(text);
        text.initDimensions();
        canvas.renderAll()
      } 
      canvas.on('mouse:down', addText);

      return () => {
        canvas.selection = true;
        canvas.off('mouse:down', addText)
      }
    }
  }, [canvas, element, tool])
}
