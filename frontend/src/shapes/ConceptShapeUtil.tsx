import { ShapeUtil, HTMLContainer, Rectangle2d, type TLBaseShape, T } from 'tldraw'
import { ConceptNode } from '../components/nodes/ConceptNode'

type IConceptShape = TLBaseShape<
  'concept-shape',
  {
    w: number
    h: number
    nodeId: string
    nodeData: any // Store the full node data
  }
>

export class ConceptShapeUtil extends ShapeUtil<IConceptShape> {
  static override type = 'concept-shape' as const
  
  static override props = {
    w: T.number,
    h: T.number,
    nodeId: T.string,
    nodeData: T.any,
  }

  getDefaultProps(): IConceptShape['props'] {
    return {
      w: 160,
      h: 80,
      nodeId: '',
      nodeData: null,
    }
  }

  getGeometry(shape: IConceptShape) {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    })
  }

  component(shape: IConceptShape) {
    if (!shape.props.nodeData) {
      return (
        <HTMLContainer style={{ width: shape.props.w, height: shape.props.h }}>
          <div>Loading...</div>
        </HTMLContainer>
      )
    }

    return (
      <HTMLContainer style={{ width: shape.props.w, height: shape.props.h }}>
        <ConceptNode 
          node={shape.props.nodeData}
          onClick={(nodeId) => {
            // Handle node click through shape
            console.log('Node clicked:', nodeId)
          }}
          onHover={(nodeId, isHovered) => {
            // Handle hover through shape
          }}
          isLoading={false}
        />
      </HTMLContainer>
    )
  }

  indicator(shape: IConceptShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}

