import {
  useRef,
  useEffect,
  useState,
} from 'react';

import type Konva from 'konva';

import {
  Stage,
  Layer,
  Group,
  Transformer,
  Rect,
  Line,
} from 'react-konva';

import { useCanvasStore } from '../../store/useCanvasStore';

import { CanvasElementRenderer } from '../../renderers/CanvasElementRenderer';

import type { CanvasElement, TextElement, BarcodeElement } from '../../services/zpl/types';

import {
  mmToPx,
  pxToMm,
  PREVIEW_SCALE,
} from '../../utils/measurements';

export const LabelCanvas = () => {
  const elements =
    useCanvasStore(
      (state) => state.elements
    );

  const updateElement =
    useCanvasStore(
      (state) =>
        state.updateElement
    );

  const selectedElementId =
    useCanvasStore(
      (state) =>
        state.selectedElementId
    );

  const setSelectedElementId =
    useCanvasStore(
      (state) =>
        state.setSelectedElementId
    );

  const labelWidthMm =
    useCanvasStore(
      (state) =>
        state.labelWidthMm
    );

  const labelHeightMm =
    useCanvasStore(
      (state) =>
        state.labelHeightMm
    );

  const trRef =
    useRef<Konva.Transformer | null>(
      null
    );

  const stageRef =
    useRef<Konva.Stage | null>(
      null
    );

  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(PREVIEW_SCALE);

  const canvasWidth =
    Math.round(
      mmToPx(labelWidthMm)
    );

  const canvasHeight =
    Math.round(
      mmToPx(labelHeightMm)
    );

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const padding = 48;
        const availableWidth = Math.max(10, width - padding);
        const availableHeight = Math.max(10, height - padding);
        
        const scaleX = availableWidth / canvasWidth;
        const scaleY = availableHeight / canvasHeight;
        
        let newScale = Math.min(scaleX, scaleY);
        newScale = Math.max(0.05, Math.min(newScale, 2));
        
        setScale(newScale);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [canvasWidth, canvasHeight]);

  useEffect(() => {
    if (
      selectedElementId &&
      trRef.current &&
      stageRef.current
    ) {
      const node =
        stageRef.current.findOne(
          '#' +
            selectedElementId
        );

      if (node) {
        trRef.current.nodes([
          node,
        ]);

        trRef.current
          .getLayer()
          ?.batchDraw();
      }
    }
  }, [
    selectedElementId,
    elements,
  ]);

  const checkDeselect = (
    e: Konva.KonvaEventObject<
      MouseEvent | TouchEvent
    >
  ) => {
    const clickedOnEmpty =
      e.target ===
      e.target.getStage();

    if (clickedOnEmpty) {
      setSelectedElementId(
        null
      );
    }
  };

  const gridLines = [];

  for (
    let mm = 0;
    mm <= labelWidthMm;
    mm += 5
  ) {
    const x = mmToPx(mm);

    gridLines.push(
      <Line
        key={`v-${mm}`}
        points={[
          x,
          0,
          x,
          canvasHeight,
        ]}
        stroke={
          mm % 10 === 0
            ? '#334155'
            : '#CBD5E1'
        }
        strokeWidth={
          mm % 10 === 0
            ? 1.2
            : 0.6
        }
      />
    );
  }

  for (
    let mm = 0;
    mm <= labelHeightMm;
    mm += 5
  ) {
    const y = mmToPx(mm);

    gridLines.push(
      <Line
        key={`h-${mm}`}
        points={[
          0,
          y,
          canvasWidth,
          y,
        ]}
        stroke={
          mm % 10 === 0
            ? '#334155'
            : '#CBD5E1'
        }
        strokeWidth={
          mm % 10 === 0
            ? 1.2
            : 0.6
        }
      />
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full flex justify-center items-center overflow-hidden">
      <Stage
        width={
          canvasWidth *
          scale
        }
        height={
          canvasHeight *
          scale
        }
        scaleX={scale}
        scaleY={scale}
        className="bg-white"
        onMouseDown={
          checkDeselect
        }
        onTouchStart={
          checkDeselect
        }
        ref={stageRef}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="#FFFFFF"
            stroke="#CBD5E1"
            strokeWidth={1}
          />

          {gridLines}

          {elements.map((el) => (
            <Group
  key={el.id}
  id={el.id}
  x={Math.round(mmToPx(el.xMm))}
  y={Math.round(mmToPx(el.yMm))}
  draggable
  dragBoundFunc={function (this: Konva.Node, pos) {
    const box = this.getClientRect({ skipTransform: true });
    return {
      x: Math.max(
        0,
        Math.min(
          pos.x,
          (canvasWidth - box.width) * scale
        )
      ),
      y: Math.max(
        0,
        Math.min(
          pos.y,
          (canvasHeight - box.height) * scale
        )
      ),
    };
  }}
  onClick={() =>
    setSelectedElementId(el.id)
  }
  onTap={() =>
    setSelectedElementId(el.id)
  }
  onDragEnd={(e) => {
    const nx = e.target.x();
    const ny = e.target.y();

    const updated: Partial<CanvasElement> = {
      xMm: pxToMm(nx),
      yMm: pxToMm(ny),
    };

    updateElement(el.id, updated);
  }}
  onTransformEnd={(e) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    const xMm = pxToMm(node.x());
    const yMm = pxToMm(node.y());

    if (el.type === 'text') {
      const textEl = el as TextElement;
      updateElement(el.id, {
        xMm,
        yMm,
        widthMm: Math.max(1, textEl.widthMm * scaleX),
        fontSizeMm: Math.max(1, textEl.fontSizeMm * scaleY),
      } as Partial<TextElement>);
    } else {
      updateElement(el.id, {
        xMm,
        yMm,
        widthMm: Math.max(1, el.widthMm * scaleX),
        heightMm: Math.max(1, el.heightMm * scaleY),
      } as Partial<BarcodeElement>);
    }
  }}
>
  <CanvasElementRenderer element={el} />
</Group>
          ))}

          {selectedElementId && (
            <Transformer
              ref={trRef}
              rotateEnabled={
                false
              }
            />
          )}
        </Layer>
      </Stage>
    </div>
  );
};