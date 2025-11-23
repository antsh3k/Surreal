import { ShapeUtil, HTMLContainer, Rectangle2d, type TLBaseShape, T } from 'tldraw'
import StarBorder from '../components/ui/StarBorder'
import { ShinyText } from '../components/ui/ShinyText'

type IConceptShape = TLBaseShape<
  'concept-shape',
  {
    w: number
    h: number
    text: string
    preferenceScore: number
  }
>

export class ConceptShapeUtil extends ShapeUtil<IConceptShape> {
  static override type = 'concept-shape' as const
  
  static override props = {
    w: T.number,
    h: T.number,
    text: T.string,
    preferenceScore: T.number,
  }

  getDefaultProps(): IConceptShape['props'] {
    return {
      w: 200,
      h: 100,
      text: 'Concept',
      preferenceScore: 0,
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
    const showStarBorder = shape.props.preferenceScore > 0.7
    const showShinyText = shape.props.preferenceScore > 0.5

    return (
      <HTMLContainer
        className="concept-shape-container"
        style={{
          width: shape.props.w,
          height: shape.props.h,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          border: '2px solid #e5e5e5',
          borderRadius: '8px',
          padding: '16px',
          position: 'relative',
        }}
      >
        {showStarBorder ? (
          <StarBorder
            color={shape.props.preferenceScore > 0.8 ? "gold" : "green"}
            thickness={1}
            speed="2s"
            style={{ position: 'absolute', inset: 0 }}
          >
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              width: '100%' 
            }}>
              {showShinyText ? (
                <ShinyText text={shape.props.text} />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                  {shape.props.text}
                </span>
              )}
            </div>
          </StarBorder>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%', 
            width: '100%' 
          }}>
            {showShinyText ? (
              <ShinyText text={shape.props.text} />
            ) : (
              <span style={{ fontSize: '14px', fontWeight: 500, color: '#111827' }}>
                {shape.props.text}
              </span>
            )}
          </div>
        )}
      </HTMLContainer>
    )
  }

  indicator(shape: IConceptShape) {
    return <rect width={shape.props.w} height={shape.props.h} />
  }
}

