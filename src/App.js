import studio from '@theatre/studio'
import { getProject, types } from '@theatre/core'
import * as d from '@theatre/dataverse'
studio.initialize()

const project = getProject('HTML Animation Tutorial')
const sheet = project.sheet('Sheet 1')
const obj = sheet.object('Heading 1', {
  y: 0,
  opacity: types.number(1, { range: [0, 1] })
})

function App() {

  const setPrimitivePropAsSequenced = (obj, propsPrimitive) => {
    const studioPrivate = window.__TheatreJS_StudioBundle._studio
    studioPrivate.transaction(({ stateEditors }) => {
      const pathToProp = d.getPointerParts(propsPrimitive).path
      const propAddress = { ...obj.address, pathToProp }
      console.log(propAddress)
      stateEditors.coreByProject.historic.sheetsById.sequence.setPrimitivePropAsSequenced(
        propAddress
      )
    })
  }

  const setPrimitivePropAsStatic = (obj, propsPrimitive) => {
    const studioPrivate = window.__TheatreJS_StudioBundle._studio
    studioPrivate.transaction(({ stateEditors }) => {
      const pathToProp = d.getPointerParts(propsPrimitive).path
      const propAddress = { ...obj.address, pathToProp }
      stateEditors.coreByProject.historic.sheetsById.sequence.setPrimitivePropAsStatic(
        propAddress
      )
    })
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <button onClick={() => setPrimitivePropAsSequenced(obj, obj.props.y)}> Sequence Y</button>
      <button onClick={() => setPrimitivePropAsSequenced(obj, obj.props.opacity)}> Sequence Opacity</button>
      <button onClick={() => setPrimitivePropAsStatic(obj, obj.props.opacity)}>Sataic opacity</button>
      <button onClick={() => setPrimitivePropAsStatic(obj, obj.props.y)}>Sataic Y</button>
    </div>
  );
}

export default App;
