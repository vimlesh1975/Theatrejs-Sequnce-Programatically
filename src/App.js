import studio from '@theatre/studio'
import { getProject, types } from '@theatre/core'
import {setPrimitivePropAsSequenced, setPrimitivePropAsStatic} from './code'
studio.initialize()

const project = getProject('HTML Animation Tutorial')
const sheet = project.sheet('Sheet 1')
const obj = sheet.object('Heading 1', {
  y: 0,
  opacity: types.number(1, { range: [0, 1] })
})

function App() {
  return (
    <div style={{ textAlign: 'center' }}>
      <button onClick={() => setPrimitivePropAsSequenced(obj, obj.props.y)}> Sequence Y</button>
      <button onClick={() => setPrimitivePropAsSequenced(obj, obj.props.opacity)}> Sequence Opacity</button>
      <button onClick={() => setPrimitivePropAsStatic(obj, obj.props.opacity)}>Static opacity</button>
      <button onClick={() => setPrimitivePropAsStatic(obj, obj.props.y)}>Static Y</button>
    </div>
  );
}

export default App;
