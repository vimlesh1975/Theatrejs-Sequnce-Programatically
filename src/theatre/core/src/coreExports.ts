import projectsSingleton from './projects/projectsSingleton'
import type {OnDiskState} from './projects/store/storeTypes'
import type {IProject, IProjectConfig} from './projects/TheatreProject'
import TheatreProject from './projects/TheatreProject'
import globals from '@theatre/shared/globals'
import * as types from './propTypes'
import {InvalidArgumentError} from '@theatre/shared/utils/errors'
import {validateName} from '@theatre/shared/utils/sanitizers'
import userReadableTypeOfValue from '@theatre/shared/utils/userReadableTypeOfValue'
import deepEqual from 'fast-deep-equal'
import type {PointerType, Prism} from '@theatre/dataverse'
import {isPointer} from '@theatre/dataverse'
import {isPrism, pointerToPrism} from '@theatre/dataverse'
import type {$IntentionalAny, VoidFn} from '@theatre/shared/utils/types'
import type {ProjectId} from '@theatre/shared/utils/ids'
import {_coreLogger} from './_coreLogger'
import {getCoreTicker} from './coreTicker'
import type {IRafDriver} from './rafDrivers'
import {privateAPI} from './privateAPIs'
export {notify} from '@theatre/shared/notify'
export {types}
export {createRafDriver} from './rafDrivers'
export type {IRafDriver} from './rafDrivers'

/**
 * Returns a project of the given id, or creates one if it doesn't already exist.
 *
 * @remarks
 * If \@theatre/studio is also loaded, then the state of the project will be managed by the studio.
 *
 * [Learn more about exporting](https://www.theatrejs.com/docs/latest/manual/projects#state)
 *
 * @example
 * Usage:
 * ```ts
 * import {getProject} from '@theatre/core'
 * const config = {} // the config can be empty when starting a new project
 * const project = getProject("a-unique-id", config)
 * ```
 *
 * @example
 * Usage with an explicit state:
 * ```ts
 * import {getProject} from '@theatre/core'
 * import state from './saved-state.json'
 * const config = {state} // here the config contains our saved state
 * const project = getProject("a-unique-id", config)
 * ```
 */
export function getProject(id: string, config: IProjectConfig = {}): IProject {
  const existingProject = projectsSingleton.get(id as ProjectId)
  if (existingProject) {
    if (process.env.NODE_ENV !== 'production') {
      if (!deepEqual(config, existingProject.config)) {
        throw new Error(
          `You seem to have called Theatre.getProject("${id}", config) twice, with different config objects. ` +
            `This is disallowed because changing the config of a project on the fly can lead to hard-to-debug issues.\n\n` +
            `You can fix this by either calling Theatre.getProject() once per projectId,` +
            ` or calling it multiple times but with the exact same config.`,
        )
      }
    }
    return existingProject.publicApi
  }

  const rootLogger = _coreLogger()
  const plogger = rootLogger.named('Project', id)

  if (process.env.NODE_ENV !== 'production') {
    validateName(id, 'projectName in Theatre.getProject(projectName)', true)
    validateProjectIdOrThrow(id)
    plogger._debug('validated projectName', {projectName: id})
  }

  if (config.state) {
    if (process.env.NODE_ENV !== 'production') {
      shallowValidateOnDiskState(id as ProjectId, config.state)
      plogger._debug('shallow validated config.state on disk')
    } else {
      deepValidateOnDiskState(id as ProjectId, config.state)
      plogger._debug('deep validated config.state on disk')
    }
  } else {
    plogger._debug('no config.state')
  }

  return new TheatreProject(id, config)
}

/**
 * Lightweight validator that only makes sure the state's definitionVersion is correct.
 * Does not do a thorough validation of the state.
 */
const shallowValidateOnDiskState = (projectId: ProjectId, s: OnDiskState) => {
  if (
    Array.isArray(s) ||
    s == null ||
    s.definitionVersion !== globals.currentProjectStateDefinitionVersion
  ) {
    throw new InvalidArgumentError(
      `Error validating conf.state in Theatre.getProject(${JSON.stringify(
        projectId,
      )}, conf). The state seems to be formatted in a way that is unreadable to Theatre.js. Read more at https://www.theatrejs.com/docs/latest/manual/projects#state`,
    )
  }
}

const deepValidateOnDiskState = (projectId: ProjectId, s: OnDiskState) => {
  shallowValidateOnDiskState(projectId, s)
  // @TODO do a deep validation here
}

const validateProjectIdOrThrow = (value: string) => {
  if (typeof value !== 'string') {
    throw new InvalidArgumentError(
      `Argument 'projectId' in \`Theatre.getProject(projectId, ...)\` must be a string. Instead, it was ${userReadableTypeOfValue(
        value,
      )}.`,
    )
  }

  const idTrimmed = value.trim()
  if (idTrimmed.length !== value.length) {
    throw new InvalidArgumentError(
      `Argument 'projectId' in \`Theatre.getProject("${value}", ...)\` should not have surrounding whitespace.`,
    )
  }

  if (idTrimmed.length < 3) {
    throw new InvalidArgumentError(
      `Argument 'projectId' in \`Theatre.getProject("${value}", ...)\` should be at least 3 characters long.`,
    )
  }
}

/**
 * Calls `callback` every time the pointed value of `pointer` changes.
 *
 * @param pointer - A Pointer (like `object.props.x`)
 * @param callback - The callback is called every time the value of pointer changes
 * @param rafDriver - (optional) The `rafDriver` to use. Learn how to use `rafDriver`s [from the docs](https://www.theatrejs.com/docs/latest/manual/advanced#rafdrivers).
 * @returns An unsubscribe function
 *
 * @example
 * Usage:
 * ```ts
 * import {getProject, onChange} from '@theatre/core'
 *
 * const obj = getProject("A project").sheet("Scene").object("Box", {position: {x: 0}})
 *
 * const usubscribe = onChange(obj.props.position.x, (x) => {
 *   console.log('position.x changed to:', x)
 * })
 *
 * setTimeout(usubscribe, 10000) // stop listening to changes after 10 seconds
 * ```
 */
export function onChange<
  P extends PointerType<$IntentionalAny> | Prism<$IntentionalAny>,
>(
  pointer: P,
  callback: (
    value: P extends PointerType<infer T>
      ? T
      : P extends Prism<infer T>
      ? T
      : unknown,
  ) => void,
  rafDriver?: IRafDriver,
): VoidFn {
  const ticker = rafDriver ? privateAPI(rafDriver).ticker : getCoreTicker()

  if (isPointer(pointer)) {
    const pr = pointerToPrism(pointer)
    return pr.onChange(ticker, callback as $IntentionalAny, true)
  } else if (isPrism(pointer)) {
    return pointer.onChange(ticker, callback as $IntentionalAny, true)
  } else {
    throw new Error(
      `Called onChange(p) where p is neither a pointer nor a prism.`,
    )
  }
}

/**
 * Takes a Pointer and returns the value it points to.
 *
 * @param pointer - A pointer (like `object.props.x`)
 * @returns The value the pointer points to
 *
 * @example
 *
 * Usage
 * ```ts
 * import {val, getProject} from '@theatre/core'
 *
 * const obj = getProject("A project").sheet("Scene").object("Box", {position: {x: 0}})
 *
 * console.log(val(obj.props.position.x)) // logs the value of obj.props.x
 * ```
 */
export function val<T>(pointer: PointerType<T>): T {
  if (isPointer(pointer)) {
    return pointerToPrism(pointer).getValue() as $IntentionalAny
  } else {
    throw new Error(`Called val(p) where p is not a pointer.`)
  }
}
