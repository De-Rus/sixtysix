declare module "react-plotly.js" {
  import { Component } from "react";
  import Plotly from "plotly.js";

  interface PlotParams {
    data?: Plotly.Data[];
    layout?: Partial<Plotly.Layout>;
    config?: Partial<Plotly.Config>;
    frames?: Plotly.Frame[];
    style?: React.CSSProperties;
    className?: string;
    useResizeHandler?: boolean;
    debug?: boolean;
    divId?: string;
    onClick?: (event: any) => void;
    onBeforeHover?: (event: any) => void;
    onHover?: (event: any) => void;
    onUnHover?: (event: any) => void;
    onSelected?: (event: any) => void;
    onDeselect?: (event: any) => void;
    onDoubleClick?: (event: any) => void;
    onRelayout?: (event: any) => void;
    onRestyle?: (event: any) => void;
    onRedraw?: () => void;
    onAnimated?: () => void;
    onAfterPlot?: () => void;
    onInitialized?: (figure: any) => void;
    onError?: (err: Error) => void;
    onPurge?: () => void;
    onTransition?: () => void;
    onTransitionInterrupted?: () => void;
    onRangeSliderButtonClick?: (event: any) => void;
    onLegendClick?: (event: any) => void;
    onLegendDoubleClick?: (event: any) => void;
    onSliderChange?: (event: any) => void;
    onSliderEnd?: (event: any) => void;
    onSliderStart?: (event: any) => void;
    onAnimatingFrame?: (event: any) => void;
    onRangeSliderRelayout?: (event: any) => void;
    onSelecting?: (event: any) => void;
    onUpdate?: (figure: any) => void;
    onButtonClicked?: (event: any) => void;
    onClickAnnotation?: (event: any) => void;
    onAutoSize?: () => void;
    onToggleLegend?: () => void;
    onToggleSpikelines?: () => void;
    onAddTraces?: (event: any) => void;
    onDeleteTraces?: (event: any) => void;
    onMoveTraces?: (event: any) => void;
    onReorderTraces?: (event: any) => void;
    onReanimate?: () => void;
    onMouseDown?: (event: any) => void;
    onMouseMove?: (event: any) => void;
    onMouseUp?: (event: any) => void;
    onRightClick?: (event: any) => void;
  }

  export default class Plot extends Component<PlotParams> {}
}

declare global {
  interface Window {
    Plotly: any;
  }
}
