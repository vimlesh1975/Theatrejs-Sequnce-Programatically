import * as d from '@theatre/dataverse'

export const setPrimitivePropAsSequenced = (object, propsPrimitive) => {
    const studioPrivate = window.__TheatreJS_StudioBundle._studio
    studioPrivate.transaction(({ stateEditors }) => {
      const pathToProp = d.getPointerParts(propsPrimitive).path
      const propAddress = { ...object.address, pathToProp }
      stateEditors.coreByProject.historic.sheetsById.sequence.setPrimitivePropAsSequenced(
        propAddress
      )
    })
  }

  export const setPrimitivePropAsStatic = (object, propsPrimitive) => {
    const studioPrivate = window.__TheatreJS_StudioBundle._studio
    studioPrivate.transaction(({ stateEditors }) => {
      const pathToProp = d.getPointerParts(propsPrimitive).path
      const propAddress = { ...object.address, pathToProp }
      stateEditors.coreByProject.historic.sheetsById.sequence.setPrimitivePropAsStatic(
        propAddress
      )
    })
  }