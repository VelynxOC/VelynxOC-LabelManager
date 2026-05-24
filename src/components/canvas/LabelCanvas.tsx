import { useRef, useEffect } from 'react';
import type Konva from 'konva';
import { Stage, Layer, Group, Transformer, Rect, Line } from 'react-konva';
import { useCanvasStore } from '../../store/useCanvasStore';
import { CanvasElementRenderer } from '../../renderers/CanvasElementRenderer';
import type { CanvasElement } from '../../services/zpl/types';
import { mmToPx, pxToMm, DEFAULT_LABEL_HEIGHT_MM, DEFAULT_LABEL_WIDTH_MM } from '../../utils/measurements';

export const LabelCanvas = () => {
  const elements = useCanvasStore((state) => state.elements);
  const updateElement = useCanvasStore((state) => state.updateElement);
  const selectedElementId = useCanvasStore((state) => state.selectedElementId);
  const setSelectedElementId = useCanvasStore((state) => state.setSelectedElementId);

  const trRef = useRef<Konva.Transformer | null>(null);
  const stageRef = useRef<Konva.Stage | null>(null);

  useEffect(() => {
    if (selectedElementId && trRef.current && stageRef.current) {
      const node = stageRef.current.findOne('#' + selectedElementId);
      if (node) {
        trRef.current.nodes([node]);
        trRef.current.getLayer()?.batchDraw();
      }
    }
  }, [selectedElementId, elements]);

  const checkDeselect = (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>) => {
    const clickedOnEmpty = e.target === e.target.getStage();
    if (clickedOnEmpty) {
      setSelectedElementId(null);
    }
  };

  const canvasWidth = Math.round(mmToPx(DEFAULT_LABEL_WIDTH_MM));
  const canvasHeight = Math.round(mmToPx(DEFAULT_LABEL_HEIGHT_MM));

  const pxToMmLocal = (px: number) => pxToMm(px);

  const gridLines = [];
  for (let mm = 0.0; mm <= DEFAULT_LABEL_WIDTH_MM; mm += 5) {
    const x = mmToPx(mm);
    gridLines.push(
      <Line
        key={`v-${mm}`}
        points={[x, 0, x, canvasHeight]}
        stroke={mm % 10 === 0 ? '#334155' : '#475569'}
        strokeWidth={mm % 10 === 0 ? 1.2 : 0.6}
      />
    );
  }
  for (let mm = 0.0; mm <= DEFAULT_LABEL_HEIGHT_MM; mm += 5) {
    const y = mmToPx(mm);
    gridLines.push(
      <Line
        key={`h-${mm}`}
        points={[0, y, canvasWidth, y]}
        stroke={mm % 10 === 0 ? '#334155' : '#475569'}
        strokeWidth={mm % 10 === 0 ? 1.2 : 0.6}
      />
    );
  }

  return (
    <div className="flex justify-center items-center bg-slate-800 p-6 rounded-xl shadow-2xl border border-slate-700">
      <Stage
        width={canvasWidth}
        height={canvasHeight}
        className="rounded shadow-inner"
        onMouseDown={checkDeselect}
        onTouchStart={checkDeselect}
        ref={stageRef}
      >
        <Layer>
          <Rect
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill="#f8fafc"
            shadowColor="#000"
            shadowBlur={8}
            shadowOpacity={0.04}
            cornerRadius={8}
          />
          {gridLines}
          {elements.map((el) => (
            <Group
              key={el.id}
              id={el.id}
              x={Math.round(mmToPx(el.xMm))}
              y={Math.round(mmToPx(el.yMm))}
              draggable
              onClick={() => setSelectedElementId(el.id)}
              onTap={() => setSelectedElementId(el.id)}
              onDragEnd={(e) => {
                const nx = e.target.x();
                const ny = e.target.y();
                const updated: Partial<CanvasElement> = {
                  xMm: pxToMmLocal(nx),
                  yMm: pxToMmLocal(ny),
                };
                updateElement(el.id, updated);
              }}
            >
              <CanvasElementRenderer element={el} />
            </Group>
          ))}
          {selectedElementId && <Transformer ref={trRef} rotateEnabled={false} />}
        </Layer>
      </Stage>
    </div>
  );
};
