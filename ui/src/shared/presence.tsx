import type { ComponentChildren } from "preact"
import { useEffect, useRef, useState } from "preact/hooks"

type PresenceStatus = "entering" | "present" | "exiting"
type Key = string | number

export interface PresentItem<T> {
	item: T
	key: Key
	status: PresenceStatus
}

type Timer =
	| { type: "timeout"; id: ReturnType<typeof setTimeout> }
	| { type: "frame"; id: number }

export function usePresenceList<T>(
	currList: T[],
	getKey: (item: T) => Key,
	enterDuration = 300,
	exitDuration = 300,
): PresentItem<T>[] {
	const [renderedList, setRenderedList] = useState<PresentItem<T>[]>(() =>
		currList.map((item) => ({
			item,
			key: getKey(item),
			status: "present",
		})),
	)

	const prevKeysRef = useRef<Set<Key>>(new Set(currList.map(getKey)))

	const timersRef = useRef<Map<Key, Timer>>(new Map())

	const clearTimer = (key: Key) => {
		const timer = timersRef.current.get(key)
		if (timer === undefined) return
		if (timer.type === "timeout") {
			clearTimeout(timer.id)
		} else {
			cancelAnimationFrame(timer.id)
		}
		timersRef.current.delete(key)
	}

	const setTimer = (key: Key, callback: () => void, duration: number) => {
		clearTimer(key)
		const timer = setTimeout(() => {
			timersRef.current.delete(key)
			callback()
		}, duration)
		timersRef.current.set(key, { type: "timeout", id: timer })
	}

	const setFrame = (key: Key, callback: () => void) => {
		clearTimer(key)
		const frame = requestAnimationFrame(() => {
			timersRef.current.delete(key)
			callback()
		})
		timersRef.current.set(key, { type: "frame", id: frame })
	}

	useEffect(() => {
		const timers = timersRef.current
		return () => {
			for (const key of timers.keys()) {
				clearTimer(key)
			}
		}
	}, [])

	useEffect(() => {
		const currKeys = new Set(currList.map(getKey))
		const prevKeys = prevKeysRef.current
		const addedKeys = currKeys.difference(prevKeys)
		const removedKeys = prevKeys.difference(currKeys)

		setRenderedList((prev) => {
			const prevMap = new Map<Key, PresentItem<T>>()
			for (const p of prev) {
				prevMap.set(p.key, p)
			}

			const exitingAfter = new Map<Key | null, PresentItem<T>[]>()
			let lastActiveKey: Key | null = null
			for (const p of prev) {
				const key = p.key

				if (currKeys.has(key)) {
					lastActiveKey = key
					continue
				}

				const exiting = exitingAfter.get(lastActiveKey) ?? []
				exiting.push({
					...p,
					status: "exiting",
				})
				exitingAfter.set(lastActiveKey, exiting)
			}

			const nextList: PresentItem<T>[] = []

			const leading = exitingAfter.get(null)
			if (leading) {
				nextList.push(...leading)
			}

			for (const item of currList) {
				const key = getKey(item)

				const existing = prevMap.get(key)
				nextList.push({
					item,
					key,
					status:
						addedKeys.has(key) || existing?.status === "entering"
							? "entering"
							: "present",
				})

				const exiting = exitingAfter.get(key)
				if (exiting) {
					nextList.push(...exiting)
				}
			}

			return nextList
		})

		// entering -> present
		for (const key of addedKeys) {
			setFrame(key, () =>
				setTimer(
					key,
					() =>
						setRenderedList((xs) =>
							xs.map((x) => {
								if (x.key === key && x.status === "entering") {
									return {
										...x,
										status: "present",
									}
								} else {
									return x
								}
							}),
						),
					enterDuration,
				),
			)
		}

		// exiting -> removed
		for (const key of removedKeys) {
			setTimer(
				key,
				() => setRenderedList((xs) => xs.filter((x) => x.key !== key)),
				exitDuration,
			)
		}

		prevKeysRef.current = currKeys
	}, [currList, enterDuration, exitDuration, getKey])

	return renderedList
}

export const Presence = (props: {
	children: ComponentChildren
	status: PresenceStatus
	style?: string
}) => {
	return (
		<div class={`presence ${props.style ?? ""} presence-${props.status}`}>
			{props.children}
		</div>
	)
}
