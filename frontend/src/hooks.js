import { useEffect, useState } from 'react'

// Runs an async loader on mount and whenever `deps` change; exposes data / error / loading and reload().
// `loading` is derived (result key !== current key), so no state is set synchronously in the effect.
export function useLoad(loader, deps = []) {
  const [tick, setTick] = useState(0)
  const [result, setResult] = useState({ key: null, depsKey: null, data: null, error: null })
  const depsKey = JSON.stringify(deps)
  const key = depsKey + ':' + tick

  useEffect(() => {
    let cancelled = false
    loader()
      .then((data) => !cancelled && setResult({ key, depsKey, data, error: null }))
      .catch((error) => !cancelled && setResult({ key, depsKey, data: null, error }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const fresh = result.key === key
  const sameDeps = result.depsKey === depsKey
  const data = sameDeps ? result.data : null
  return {
    data,
    error: fresh ? result.error : null,
    loading: !fresh && data === null,
    reload: () => setTick((t) => t + 1),
  }
}

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} | Nova Drive` : 'Nova Drive - Futuristic Car Rental'
  }, [title])
}
