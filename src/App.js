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

  const aa = (propsPrimitive) => {
    const studioPrivate = window.__TheatreJS_StudioBundle._studio
    studioPrivate.transaction(({ stateEditors }) => {
      const pathToProp = d.getPointerParts(propsPrimitive).path
      const propAddress = {...obj.address, pathToProp}
      stateEditors.coreByProject.historic.sheetsById.sequence.setPrimitivePropAsSequenced(
        propAddress,project
      )
    })
  }

  const bb = (propsPrimitive) => {
    const studioPrivate = window.__TheatreJS_StudioBundle._studio
    studioPrivate.transaction(({ stateEditors }) => {
      const pathToProp = d.getPointerParts(propsPrimitive).path
      const propAddress = {...obj.address, pathToProp}
      stateEditors.coreByProject.historic.sheetsById.sequence.setPrimitivePropAsStatic(
        propAddress,project
      )
    })
  }

  return (
    <div style={{ textAlign: 'center' }}>
      <button onClick={()=>aa(obj.props.y)}> Sequence Y</button>
      <button onClick={()=>aa(obj.props.opacity)}> Sequence Opacity</button>
      <button onClick={()=>bb(obj.props.opacity)}>Sataic opacity</button>
      <button onClick={()=>bb(obj.props.y)}>Sataic Y</button>
    </div>
  );
}

export default App;
