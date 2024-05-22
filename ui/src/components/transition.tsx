import { useSignal } from "@preact/signals"
import {
	cloneElement,
	toChildArray,
	type FunctionComponent,
	type Key,
	type VNode,
} from "preact"
import type { HTMLAttributes } from "preact/compat"
import {
	useCallback,
	useEffect,
	useReducer,
	useRef,
	useState,
} from "preact/hooks"

type OnTransitionEnd = (key: Key) => void

export const Transition: FunctionComponent<{
	show?: boolean
	onTransitionEnd?: OnTransitionEnd
}> = (props) => {
	const [display, setDisplay] = useState(props.show)
	const onEnd = useCallback(() => {
		if (!props.show) {
			setDisplay(false)
			props.onTransitionEnd?.(props.key)
		}
	}, [props.show])

	if (!display) return null
	const childArr = toChildArray(props.children)
	if (childArr.length > 1) throw new Error("children length !== 1")
	if (childArr.length === 0) return null
	const child = childArr[0]!
	if (typeof child !== "object") return <>{child}</>
	return cloneElement(child, { onanimationend: onEnd })
}

const mergePrevCurrChildren = (
	prev: VNode[],
	curr: VNode[],
	onTransitionEnd: OnTransitionEnd,
): VNode[] => {
	const next: VNode[] = []

	let i = 0
	let iLen = prev.length
	let j = 0
	let jLen = curr.length
	while (i < iLen && j < jLen) {
		const p = prev[i]!
		const found = curr.findIndex((elem) => {
			if (p === elem) return true
			return (
				typeof p === "object" &&
				typeof elem === "object" &&
				p.key === elem.key
			)
		})

		if (found === -1) {
			next.push(cloneElement(p, { show: false, onTransitionEnd }))
			i++
		} else {
			while (j <= found) {
				next.push(
					cloneElement(curr[j]!, { show: true, onTransitionEnd }),
				)
				j++
			}
			i++
		}
	}
	while (i < iLen) {
		const e = prev[i]!
		next.push(cloneElement(e, { show: false, onTransitionEnd }))
		i++
	}
	while (j < jLen) {
		const e = curr[j]!
		next.push(cloneElement(e, { show: true, onTransitionEnd }))
		j++
	}

	return next
}

export const TransitionGroup: FunctionComponent<
	HTMLAttributes<HTMLDivElement>
> = (props) => {
	const currChildren = toChildArray(props.children).filter(
		(x) => typeof x === "object",
	) as VNode[]
	const nextChildren = useSignal<VNode[]>([])

	const onTransitionEnd = useCallback(
		(key: Key) => {
			nextChildren.value = nextChildren.value.filter((x) => x.key !== key)
		},
		[nextChildren],
	)
	useEffect(() => {
		nextChildren.value = mergePrevCurrChildren(
			nextChildren.value,
			currChildren,
			onTransitionEnd,
		)
	}, [props.children])

	return <div {...props}>{nextChildren}</div>
}
