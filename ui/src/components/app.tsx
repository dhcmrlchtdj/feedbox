import { email, hydrated, loaded, loadingError } from "../shared/state.ts"
import { Add } from "./add.tsx"
import { Auth } from "./auth.tsx"
import { Heading } from "./heading.tsx"
import { List } from "./list.tsx"
import { Notification } from "./notification.tsx"

export const AppInner = () => {
	return (
		<div class="page-shell">
			<Heading
				email={email.value}
				loaded={loaded.value}
			/>
			<main class="feed-section">
				<Add />
				<List />
			</main>
			<Notification />
		</div>
	)
}

export const App = () => {
	if (loadingError.value) {
		return (
			<div class="page-shell">
				<div class="auth-state">
					<Auth err={loadingError.value} />
				</div>
			</div>
		)
	} else if (hydrated || loaded.value) {
		return <AppInner />
	} else {
		return (
			<div class="page-shell">
				<output class="loading-screen">Loading your feeds…</output>
			</div>
		)
	}
}
