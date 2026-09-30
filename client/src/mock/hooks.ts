import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { getDB } from './index'
export function useDemoDB() {
  const client = useQueryClient()
  useEffect(() => {
    const refresh = () => client.invalidateQueries({ queryKey: ['demo-db'] })
    window.addEventListener('comanda:changed', refresh)
    return () => window.removeEventListener('comanda:changed', refresh)
  }, [client])
  return useQuery({ queryKey: ['demo-db'], queryFn: getDB })
}
